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
  gap: 1rem;
  width: 8rem;
  margin-top: 1rem;
`;

export const Avatar = styled.div<{ $isSkeleton?: boolean }>`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.gridBackground};
  border: 2px solid ${({ theme }) => theme.colors.displayBorder};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.displayBorder};
  text-transform: uppercase;
  ${({ $isSkeleton }) => $isSkeleton && skeletonCss}
  ${({ $isSkeleton }) => $isSkeleton && `border-color: transparent; color: transparent;`}
`;

export const Name = styled.div<{ $isSkeleton?: boolean }>`
  font-size: 1.1rem;
  font-weight: bold;
  text-align: center;
  word-break: break-all;
  ${({ $isSkeleton }) => $isSkeleton && skeletonCss}
  ${({ $isSkeleton }) => $isSkeleton && `color: transparent; border-radius: 4px; width: 80%; height: 1.2rem;`}
`;

export const Status = styled.div<{ $ready: boolean, $isSkeleton?: boolean }>`
  font-size: 0.9rem;
  font-weight: bold;
  color: ${({ $ready }) => ($ready ? '#8db596' : '#9f5f80')};
  background-color: ${({ theme }) => theme.colors.displayBackground};
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid ${({ $ready }) => ($ready ? '#8db596' : '#9f5f80')};
  ${({ $isSkeleton }) => $isSkeleton && skeletonCss}
  ${({ $isSkeleton }) => $isSkeleton && `border-color: transparent; color: transparent; width: 60%; height: 1rem;`}
`;
