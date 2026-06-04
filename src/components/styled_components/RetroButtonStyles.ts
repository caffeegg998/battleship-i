import styled, { css } from "styled-components";

const colorMap = {
  primary: { bg: '#0d47a1', shadow: '#051D41' },
  secondary: { bg: '#37474F', shadow: '#263238' },
  danger: { bg: '#CC0000', shadow: '#590000' },
  warning: { bg: '#FF8800', shadow: '#6A3800' },
  success: { bg: '#009A3E', shadow: '#00481F' },
  info: { bg: '#33b5e5', shadow: '#164E62' },
  teal: { bg: '#26a69a', shadow: '#004d40' },
};

const sizeMap = {
  sm: { width: '130px', height: '32px', fontSize: '9px', lineHeight: '28px' },
  md: { width: '240px', height: '46px', fontSize: '12px', lineHeight: '24px' },
  lg: { width: '294px', height: '54px', fontSize: '17px', lineHeight: '50px' },
};

const RetroBtnWrapper = styled.div<{ $color?: string; $size?: string; $disabled?: boolean }>`
  text-transform: uppercase;
  background: 0 0;
  display: inline-block;
  vertical-align: middle;
  margin: 0;

  ${({ $size = 'md' }) => {
    const s = sizeMap[$size as keyof typeof sizeMap] || sizeMap.md;
    return css`
      .btn {
        width: ${s.width};
        height: ${s.height};
        font-size: ${s.fontSize};
        line-height: ${s.lineHeight};
      }
    `;
  }}

  ${({ $color = 'teal' }) => {
    const c = colorMap[$color as keyof typeof colorMap] || colorMap.teal;
    return css`
      .btn .btn-inner .content-wrapper:before {
        background-color: ${c.shadow};
      }
      .btn .btn-inner .content-wrapper .btn-content {
        background-color: ${c.bg};
      }
    `;
  }}

  ${({ $disabled }) => $disabled && css`
    pointer-events: none;
    opacity: 0.5;
  `}

  .btn {
    user-select: none;
    box-sizing: border-box;
    display: inline-block;
    vertical-align: middle;
    padding-top: 3px;
    position: relative;
    cursor: pointer;
    font-weight: 600;
    font-family: inherit;
    font-style: normal;
    letter-spacing: 0;
    text-rendering: auto;
    text-decoration: none;
    text-align: center;
    transition: opacity .1s ease-out;
    z-index: 5;
    -webkit-font-smoothing: antialiased;
    background-color: transparent;
    border: none;
    outline: none;
    -webkit-tap-highlight-color: transparent;

    &:focus {
      outline: none;
    }

    &:before {
      content: " ";
      background-color: rgba(13, 13, 13, .3);
      width: calc(100% - 2px);
      height: calc(100% - 4px);
      bottom: -1px;
      left: 1px;
      position: absolute;
      border-radius: 3px;
      z-index: 1;
      transition: transform .12s ease-out, background .12s ease-out;
    }

    &.btn-active:before {
      transform: translate3d(0, -3px, 0);
    }

    .btn-inner {
      display: block;
      height: 100%;

      .content-wrapper {
        position: relative;
        font-family: inherit;
        display: flex;
        align-items: stretch;
        width: 100%;
        height: calc(100% - 3px);
        margin-top: -3px;

        &:before {
          content: " ";
          border-radius: 3px;
          position: absolute;
          top: auto;
          bottom: -3px;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          transition: background .185s ease-out, transform .185s ease-out;
        }

        &:after {
          content: " ";
          border-radius: 3px;
          position: absolute;
          width: 0;
          top: 2px;
          left: 0;
          height: 100%;
          z-index: 3;
          background-color: rgba(13, 13, 13, 0.15);
        }

        .btn-content {
          position: relative;
          display: flex;
          flex: 1;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          text-indent: 0;
          z-index: 3;
          overflow: hidden;
          padding: 0 16px;
          transition: border .185s ease-out, background .185s ease-out, color .185s ease-out, transform .185s ease-out;
          color: #ebf1f8;

          &.btn-active {
            transform: translate3d(0, 2px, 0);
            transition: transform .12s ease-out, background .12s ease-out, color .12s ease-out;

            .btn-content-inner {
              opacity: 0.1;
            }
          }

          .btn-content-inner {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            transition: opacity 75ms ease-out .1125s;
            font-size: inherit;

            &:before {
              content: attr(data-label);
              padding-top: 2px;
              letter-spacing: .06em;
              transition: opacity .3s ease-out, background-color .1125s ease-in;
              opacity: 1;
              z-index: -1;
            }
          }
        }
      }
    }
  }
`;

export { RetroBtnWrapper, colorMap, sizeMap };
