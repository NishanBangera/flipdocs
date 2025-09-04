"use client";

import { useCursor, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useAtom } from "jotai";
import { easing } from "maath";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bone,
  BoxGeometry,
  Color,
  Float32BufferAttribute,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
  MeshBasicMaterial,
  LinearFilter,
  NearestFilter,
  ClampToEdgeWrapping,
} from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { pageAtom } from "./flipbook-ui";
import type * as THREE from "three";

const easingFactor = 0.5; 
const easingFactorFold = 0.3; 
const insideCurveStrength = 0.08; 
const outsideCurveStrength = 0.02; 
const turningCurveStrength = 0.05; 

const PAGE_WIDTH = 1.28;
const PAGE_HEIGHT = 1.71; 
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes: number[] = [];
const skinWeights: number[] = [];

for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i); 
  const x = vertex.x; 

  const skinIndex = Math.max(0, Math.floor(x / SEGMENT_WIDTH)); 
  const skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH; 

  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0); 
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0); 
}

pageGeometry.setAttribute(
  "skinIndex",
  new Uint16BufferAttribute(skinIndexes, 4)
);
pageGeometry.setAttribute(
  "skinWeight",
  new Float32BufferAttribute(skinWeights, 4)
);

const whiteColor = new Color("white");

// 1x1 white PNG for missing backs (avoids loading errors with undefined)
const BLANK_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO4Fh1wAAAAASUVORK5CYII=";

const pageMaterials = [
  new MeshBasicMaterial({
    color: whiteColor,
  }),
  new MeshBasicMaterial({
    color: "#111",
  }),
  new MeshBasicMaterial({
    color: whiteColor,
  }),
  new MeshBasicMaterial({
    color: whiteColor,
  }),
];

interface PageProps {
  number: number;
  page: number;
  opened: boolean;
  bookClosed: boolean;
  frontImg: string;
  backImg?: string;
  clickEnabled?: boolean;
}

const Page = ({ number, page, opened, bookClosed, frontImg, backImg, clickEnabled = true, ...props }: PageProps) => {
  // Use useTexture with data URLs
  const [picture, picture2] = useTexture([frontImg, backImg || BLANK_IMAGE]);
  picture.colorSpace = picture2.colorSpace = SRGBColorSpace;
  const { gl } = useThree();
  const group = useRef<THREE.Group>(null);
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);

  const skinnedMeshRef = useRef<THREE.SkinnedMesh>(null);

  // Improve text clarity by using sharper filtering and disabling mipmaps
  useEffect(() => {
    [picture, picture2].forEach((tex) => {
      if (!tex) return;
      tex.wrapS = ClampToEdgeWrapping;
      tex.wrapT = ClampToEdgeWrapping;
      // NPOT textures typically can't use mipmaps reliably; keep it off for crispness
      tex.generateMipmaps = false;
      // Sharper upscaling for small text
      tex.minFilter = LinearFilter;
      tex.magFilter = NearestFilter;
      // Anisotropy is ignored without mipmaps but harmless; keep small value just in case
      if (gl?.capabilities?.getMaxAnisotropy) {
        const maxAniso = gl.capabilities.getMaxAnisotropy();
        tex.anisotropy = Math.min(4, maxAniso || 0);
      }
      tex.needsUpdate = true;
    });
  }, [picture, picture2, gl]);

  const manualSkinnedMesh = useMemo(() => {
    const bones: THREE.Bone[] = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const bone = new Bone();
      bones.push(bone);
      if (i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      if (i > 0) {
        bones[i - 1].add(bone); 
      }
    }
    const skeleton = new Skeleton(bones);

    const materials = [
      ...pageMaterials,
      new MeshBasicMaterial({
        color: whiteColor,
        map: picture,
      }),
      new MeshBasicMaterial({
        color: whiteColor,
        map: picture2,
      }),
    ];
    const mesh = new SkinnedMesh(pageGeometry, materials);
    // Keep the book looking flat/static: no shadows
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, [picture, picture2]);

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current) {
      return;
    }
    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date();
      lastOpened.current = opened;
    }
    let turningTime = Math.min(400, new Date().getTime() - turnedAt.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    // Base target rotation for the root bone (i===0) with no drag
    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8);
    }

    const bones = skinnedMeshRef.current.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];
      if (!target) continue;

      // Only apply curves during turning animation, not when page is fully opened/closed
      const isPageFullyOpened = opened && turningTime < 0.1;
      const isPageFullyClosed = !opened && turningTime < 0.1;
      
      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;
      
      let rotationAngle: number;
      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
        } else {
          rotationAngle = 0;
        }
      } else if (isPageFullyOpened || isPageFullyClosed) {
        // Keep pages flat when fully opened or closed
        rotationAngle = i === 0 ? targetRotation : 0;
      } else {
        // Apply curves only during turning animation
        rotationAngle =
          insideCurveStrength * insideCurveIntensity * targetRotation -
          outsideCurveStrength * outsideCurveIntensity * targetRotation +
          turningCurveStrength * turningIntensity * targetRotation;
      }
      
      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);
      if (bookClosed || isPageFullyOpened || isPageFullyClosed) {
        foldRotationAngle = 0;
      }
      
      easing.dampAngle(
        target.rotation,
        "y",
        rotationAngle,
        easingFactor,
        delta
      );

      const foldIntensity =
        i > 8 && !isPageFullyOpened && !isPageFullyClosed
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;
      easing.dampAngle(
        target.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta
      );
    }
  });

  const [, setPage] = useAtom(pageAtom);
  const [highlighted, setHighlighted] = useState(false);
  // Only show pointer when click to turn is enabled
  useCursor(highlighted && clickEnabled, clickEnabled ? 'pointer' : 'auto');

  return (
    <group
      {...props}
      ref={group}
      onPointerEnter={(e) => {
        if (clickEnabled) e.stopPropagation();
        if (clickEnabled) setHighlighted(true);
      }}
      onPointerLeave={(e) => {
        if (clickEnabled) e.stopPropagation();
        if (clickEnabled) setHighlighted(false);
      }}
      onClick={(e) => {
        if (!clickEnabled) return; // allow panning/group handlers to work
        e.stopPropagation();
        // Click to toggle page (when enabled)
        setPage(opened ? number : number + 1);
        setHighlighted(false);
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />
    </group>
  );
};

interface FlipbookBookProps {
  pdfPages?: string[];
  clickEnabled?: boolean;
}

export function FlipbookBook({ pdfPages = [], clickEnabled = true, ...props }: FlipbookBookProps) {
  const [page] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const goToPage = () => {
      setDelayedPage((delayedPage) => {
        if (page === delayedPage) {
          return delayedPage;
        } else {
          timeout = setTimeout(
            () => {
              goToPage();
            },
            Math.abs(page - delayedPage) > 2 ? 50 : 150
          );
          if (page > delayedPage) {
            return delayedPage + 1;
          }
          if (page < delayedPage) {
            return delayedPage - 1;
          }
        }
        return delayedPage;
      });
    };
    goToPage();
    return () => {
      clearTimeout(timeout);
    };
  }, [page]);

  // Build physical sheets: each sheet has a front (odd page) and back (even page)
  const sheets = useMemo(() => {
    const out: { front: string; back?: string }[] = [];
    for (let i = 0; i < pdfPages.length; i += 2) {
      out.push({ front: pdfPages[i], back: pdfPages[i + 1] });
    }
    return out;
  }, [pdfPages]);

  return (
    <group {...props} rotation-y={-Math.PI / 2}>
      {sheets.map((sheet, index) => (
        <Page
          key={index}
          page={delayedPage}
          number={index}
          opened={delayedPage > index}
          bookClosed={delayedPage === 0}
          frontImg={sheet.front}
          backImg={sheet.back}
          clickEnabled={clickEnabled}
        />
      ))}
    </group>
  );
}