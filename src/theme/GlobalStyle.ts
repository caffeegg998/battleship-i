import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  *, *:before, *:after {
      box-sizing: border-box;
      padding: 0;
      margin: 0;
      word-wrap: break-word;
    }
    
    html {
      line-height: 1.6;
      position: relative;
      min-height: 100%;
    }
    
    body {
      font-family: 'Montserrat', sans-serif;
      background-color: ${({ theme }) => theme.colors.background};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .app {
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    } 
    
    h1, h2, h3, h4, h5, h6 {
      line-height: 1.2;
    }
    
    a {
      text-decoration: none;
    }
    
    img {
      display: block;
      width: 100%;
    }
    
    button {
      cursor: pointer;
    }

    .header-wrap {
      display: block;
      width: auto;
      height: auto;
      padding: 0.5rem 0;
      text-align: center;
      font-size: 25px;
      font-family: 'Press Start 2P', cursive;
      color: #1a1a1a;
      transform: perspective(200px) rotateX(10deg);
      letter-spacing: .1em;
      user-select: none;
      text-shadow: 
        0 1px 0 #004d40,
        0 2px 0 #00483B,
        0 3px 0 #004639,
        0 4px 0 #004336,
        0 5px 0 #004134,
        0 6px 0 #003F32,
        0 7px 0 #003D30,
        0 8px 0 #003A2D,
        0 9px 0 #00382B,
        0 10px 0 #003528,
        0 11px 0 #003225,
        0 12px 0 #002F22,
        0 13px 0 #002B1E,
        0 14px 0 #00281C,
        0 15px 0 #001F13,
        0 22px 30px rgba(0,0,0, 0.9);
      transition: text-shadow .3s ease .3s, transform .3s ease .3s, letter-spacing .3s ease .3s;
    }

    .header-wrap:hover {
      transition: text-shadow .33s ease, transform .3s ease, letter-spacing .3s ease;
      text-shadow: 0 0 0 #004134, 0 1px 0 #00483B, 0 2px 0 #003528, 0 3px 3px rgba(0,0,0,0.9);
      transform: translate(0px, 15px) perspective(200px) rotateX(10deg);
      letter-spacing: .125em;
    }

    .header-wrap h1 {
      font-family: 'Press Start 2P', cursive;
      font-size: inherit;
      color: inherit;
    }
`;

export default GlobalStyle;