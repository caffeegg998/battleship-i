import styled, { keyframes, css } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const skeletonCss = css`
  background: #f6f7f8;
  background-image: linear-gradient(
    to right,
    #f6f7f8 0%,
    #edeef1 20%,
    #f6f7f8 40%,
    #f6f7f8 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 100%;
  animation: ${shimmer} 1s linear infinite forwards;
`;

export const ProfileContainer = styled.div<{ align: 'left' | 'right' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.2rem;
  width: auto;
  margin-top: 0;
`;

export const AvatarWrapper = styled.div<{ $ready?: boolean; $isSkeleton?: boolean }>`
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
`;

export const Avatar = styled.div<{ $isSkeleton?: boolean; $ready?: boolean }>`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.gridBackground};
  border: 2px solid ${({ $ready }) => $ready ? '#2ecc71' : '#666'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.displayBorder};
  text-transform: uppercase;
  overflow: hidden;
  transition: border-color 0.2s;
  ${({ $isSkeleton }) => $isSkeleton && skeletonCss}
  ${({ $isSkeleton }) => $isSkeleton && `border-color: transparent; color: transparent;`}
`;

export const ReadyDot = styled.div<{ $ready: boolean }>`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  background: ${({ $ready }) => $ready ? '#2ecc71' : '#666'};
  border: 2px solid rgba(30, 30, 40, 0.9);
`;

export const Name = styled.div<{ $isSkeleton?: boolean }>`
  font-size: 0.8rem;
  font-weight: bold;
  text-align: center;
  word-break: break-all;
  color: #fff;
  ${({ $isSkeleton }) => $isSkeleton && skeletonCss}
  ${({ $isSkeleton }) => $isSkeleton && `color: transparent; border-radius: 4px; width: 80%; height: 1rem;`}
`;
