import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { GameLobby } from './components/GameLobby';
import { DouDiZhu } from './games/doudizhu/DouDiZhu';
import { TexasHoldem } from './games/texas/TexasHoldem';
import { ChineseChess } from './games/chess/ChineseChess';
import { Go } from './games/go/Go';
import { Mahjong } from './games/mahjong/Mahjong';
import { Gomoku } from './games/gomoku/Gomoku';
import { Blackjack } from './games/blackjack/Blackjack';
import { ZhaJinhua } from './games/zhajinhua/ZhaJinhua';
import { NiuNiu } from './games/niuniu/NiuNiu';
import { Ludo } from './games/ludo/Ludo';
import { IntlChess } from './games/intlchess/IntlChess';
import { Othello } from './games/othello/Othello';
import { Tetris } from './games/arcade/Tetris';
import { TankBattle } from './games/arcade/TankBattle';
import { Pacman } from './games/arcade/Pacman';
import { PuzzleBobble } from './games/arcade/PuzzleBobble';
import { Strikers1945 } from './games/arcade/Strikers1945';
import { Guandan } from './games/guandan/Guandan';
import { Shengji } from './games/shengji/Shengji';
import { Shisanshui } from './games/shisanshui/Shisanshui';
import { Paodekuai } from './games/paodekuai/Paodekuai';
import { Suoha } from './games/suoha/Suoha';
import { Junqi } from './games/junqi/Junqi';
import { Tiaoqi } from './games/tiaoqi/Tiaoqi';
import { Scmj } from './games/scmj/Scmj';
import { RiichiMahjong } from './games/riichimahjong/RiichiMahjong';

const GameLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>
    <Link to="/" className="back-link" style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
      &larr; 返回大厅
    </Link>
    {children}
  </div>
);

const App: React.FC = () => {
  return (
    <UserProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameLobby />} />
        <Route path="/game/doudizhu" element={<GameLayout><DouDiZhu /></GameLayout>} />
        <Route path="/game/texas" element={<GameLayout><TexasHoldem /></GameLayout>} />
        <Route path="/game/chess" element={<GameLayout><ChineseChess /></GameLayout>} />
        <Route path="/game/go" element={<GameLayout><Go /></GameLayout>} />
        <Route path="/game/mahjong" element={<GameLayout><Mahjong /></GameLayout>} />
        <Route path="/game/gomoku" element={<GameLayout><Gomoku /></GameLayout>} />
        <Route path="/game/blackjack" element={<GameLayout><Blackjack /></GameLayout>} />
        <Route path="/game/zhajinhua" element={<GameLayout><ZhaJinhua /></GameLayout>} />
        <Route path="/game/niuniu" element={<GameLayout><NiuNiu /></GameLayout>} />
        <Route path="/game/ludo" element={<GameLayout><Ludo /></GameLayout>} />
        <Route path="/game/intlchess" element={<GameLayout><IntlChess /></GameLayout>} />
        <Route path="/game/othello" element={<GameLayout><Othello /></GameLayout>} />
        <Route path="/game/tetris" element={<GameLayout><Tetris /></GameLayout>} />
        <Route path="/game/tankbattle" element={<GameLayout><TankBattle /></GameLayout>} />
        <Route path="/game/pacman" element={<GameLayout><Pacman /></GameLayout>} />
        <Route path="/game/puzzlebobble" element={<GameLayout><PuzzleBobble /></GameLayout>} />
        <Route path="/game/strikers1945" element={<GameLayout><Strikers1945 /></GameLayout>} />
        <Route path="/game/guandan" element={<GameLayout><Guandan /></GameLayout>} />
        <Route path="/game/shengji" element={<GameLayout><Shengji /></GameLayout>} />
        <Route path="/game/shisanshui" element={<GameLayout><Shisanshui /></GameLayout>} />
        <Route path="/game/paodekuai" element={<GameLayout><Paodekuai /></GameLayout>} />
        <Route path="/game/suoha" element={<GameLayout><Suoha /></GameLayout>} />
        <Route path="/game/junqi" element={<GameLayout><Junqi /></GameLayout>} />
        <Route path="/game/tiaoqi" element={<GameLayout><Tiaoqi /></GameLayout>} />
        <Route path="/game/scmj" element={<GameLayout><Scmj /></GameLayout>} />
        <Route path="/game/riichimahjong" element={<GameLayout><RiichiMahjong /></GameLayout>} />
      </Routes>
    </BrowserRouter>
    </UserProvider>
  );
};

export default App;
