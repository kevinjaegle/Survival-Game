import React, { useState, useEffect, useCallback } from 'react';

const GRID_SIZE = 10;
const CELL_SIZE = 40;
const INITIAL_OPPONENTS = 3;
const MAX_OPPONENTS = 5;
const OPPONENT_MOVE_INTERVAL = 1000;
const ITEM_SPAWN_INTERVAL = 3000;
const DIFFICULTY_INCREASE_INTERVAL = 10000;

const SurvivalGame = () => {
  const [playerPosition, setPlayerPosition] = useState({ x: 5, y: 5 });
  const [opponents, setOpponents] = useState([]);
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState(1);

  const moveSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...'); // Base64 encoded move sound
  const collectSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...'); // Base64 encoded collect sound
  const gameOverSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...'); // Base64 encoded game over sound

  const initializeGame = useCallback(() => {
    setPlayerPosition({ x: 5, y: 5 });
    setOpponents(Array.from({ length: INITIAL_OPPONENTS }, () => ({
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    })));
    setItems([]);
    setScore(0);
    setGameOver(false);
    setDifficultyLevel(1);
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const movePlayer = useCallback((dx, dy) => {
    if (gameOver) return;
    
    setPlayerPosition(prev => {
      const newX = Math.max(0, Math.min(GRID_SIZE - 1, prev.x + dx));
      const newY = Math.max(0, Math.min(GRID_SIZE - 1, prev.y + dy));
      return { x: newX, y: newY };
    });
    moveSound.play();
  }, [gameOver]);

  const handleKeyPress = useCallback((e) => {
    switch(e.key) {
      case 'ArrowUp': movePlayer(0, -1); break;
      case 'ArrowDown': movePlayer(0, 1); break;
      case 'ArrowLeft': movePlayer(-1, 0); break;
      case 'ArrowRight': movePlayer(1, 0); break;
      default: break;
    }
  }, [movePlayer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const moveOpponents = useCallback(() => {
    setOpponents(prevOpponents => prevOpponents.map(opponent => ({
      x: Math.max(0, Math.min(GRID_SIZE - 1, opponent.x + Math.floor(Math.random() * 3) - 1)),
      y: Math.max(0, Math.min(GRID_SIZE - 1, opponent.y + Math.floor(Math.random() * 3) - 1))
    })));
  }, []);

  const spawnItem = useCallback(() => {
    setItems(prevItems => [
      ...prevItems,
      {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    ]);
  }, []);

  const increaseDifficulty = useCallback(() => {
    setDifficultyLevel(prev => {
      const newLevel = prev + 1;
      if (opponents.length < MAX_OPPONENTS && newLevel % 2 === 0) {
        setOpponents(prevOpponents => [
          ...prevOpponents,
          {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
          }
        ]);
      }
      return newLevel;
    });
  }, [opponents.length]);

  useEffect(() => {
    if (gameOver) return;

    const opponentInterval = setInterval(moveOpponents, OPPONENT_MOVE_INTERVAL / Math.sqrt(difficultyLevel));
    const itemInterval = setInterval(spawnItem, ITEM_SPAWN_INTERVAL);
    const difficultyInterval = setInterval(increaseDifficulty, DIFFICULTY_INCREASE_INTERVAL);

    return () => {
      clearInterval(opponentInterval);
      clearInterval(itemInterval);
      clearInterval(difficultyInterval);
    };
  }, [gameOver, moveOpponents, spawnItem, increaseDifficulty, difficultyLevel]);

  useEffect(() => {
    const collision = opponents.some(opponent => 
      opponent.x === playerPosition.x && opponent.y === playerPosition.y
    );

    if (collision) {
      setGameOver(true);
      gameOverSound.play();
    }

    const collectedItems = items.filter(item => 
      item.x === playerPosition.x && item.y === playerPosition.y
    );

    if (collectedItems.length > 0) {
      setScore(prev => prev + collectedItems.length);
      setItems(prevItems => prevItems.filter(item => 
        !(item.x === playerPosition.x && item.y === playerPosition.y)
      ));
      collectSound.play();
    }
  }, [playerPosition, opponents, items]);

  const restartGame = () => {
    initializeGame();
  };

  return (
    <div className="game-container">
      <svg width={GRID_SIZE * CELL_SIZE} height={GRID_SIZE * CELL_SIZE}>
        {/* Grid */}
        {Array.from({ length: GRID_SIZE }).map((_, i) => (
          <React.Fragment key={i}>
            <line
              x1={0}
              y1={i * CELL_SIZE}
              x2={GRID_SIZE * CELL_SIZE}
              y2={i * CELL_SIZE}
              stroke="#ddd"
              strokeWidth="1"
            />
            <line
              x1={i * CELL_SIZE}
              y1={0}
              x2={i * CELL_SIZE}
              y2={GRID_SIZE * CELL_SIZE}
              stroke="#ddd"
              strokeWidth="1"
            />
          </React.Fragment>
        ))}

        {/* Player */}
        <circle
          cx={playerPosition.x * CELL_SIZE + CELL_SIZE / 2}
          cy={playerPosition.y * CELL_SIZE + CELL_SIZE / 2}
          r={CELL_SIZE / 3}
          fill="blue"
        />

        {/* Opponents */}
        {opponents.map((opponent, index) => (
          <circle
            key={index}
            cx={opponent.x * CELL_SIZE + CELL_SIZE / 2}
            cy={opponent.y * CELL_SIZE + CELL_SIZE / 2}
            r={CELL_SIZE / 3}
            fill="red"
          />
        ))}

        {/* Items */}
        {items.map((item, index) => (
          <rect
            key={index}
            x={item.x * CELL_SIZE + CELL_SIZE / 4}
            y={item.y * CELL_SIZE + CELL_SIZE / 4}
            width={CELL_SIZE / 2}
            height={CELL_SIZE / 2}
            fill="gold"
          />
        ))}
      </svg>

      <div className="controls">
        <button onClick={() => movePlayer(0, -1)}>↑</button>
        <button onClick={() => movePlayer(-1, 0)}>←</button>
        <button onClick={() => movePlayer(1, 0)}>→</button>
        <button onClick={() => movePlayer(0, 1)}>↓</button>
      </div>

      <div className="score">Score: {score}</div>
      <div className="difficulty">Difficulty: {difficultyLevel}</div>

      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <button onClick={restartGame}>Restart</button>
        </div>
      )}

      <style jsx>{`
        .game-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: Arial, sans-serif;
        }
        .controls {
          margin-top: 10px;
        }
        .controls button {
          font-size: 20px;
          margin: 0 5px;
          padding: 5px 10px;
        }
        .score, .difficulty {
          margin-top: 10px;
          font-size: 18px;
        }
        .game-over {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(255, 255, 255, 0.9);
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        .game-over button {
          font-size: 18px;
          padding: 10px 20px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};

export default SurvivalGame;