import React, { createContext, useContext, useState, useRef } from 'react';
import { getDuelSocket } from '../services/socket';
import { duelAPI } from '../services/api';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [duel, setDuel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [myAnswers, setMyAnswers] = useState([]);
  const [opponentAnswers, setOpponentAnswers] = useState([]);
  const [surgeActive, setSurgeActive] = useState(false);
  const [opponentSurge, setOpponentSurge] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | searching | ban | playing | finished
  const socketRef = useRef(null);

  const joinDuel = (duelId, userId) => {
    const socket = getDuelSocket();
    socketRef.current = socket;
    socket.emit('duel:join', { duelId, userId });

    socket.on('duel:player_joined', ({ userId: uid }) => {
      console.log('Player joined:', uid);
    });

    socket.on('duel:surge_activated', ({ userId: uid }) => {
      if (uid === userId) setSurgeActive(true);
      else setOpponentSurge(true);
      setTimeout(() => {
        if (uid === userId) setSurgeActive(false);
        else setOpponentSurge(false);
      }, 6000);
    });

    socket.on('duel:answer_received', ({ userId: uid, questionIndex, correct }) => {
      if (uid !== userId) {
        setOpponentAnswers(prev => [...prev, { questionIndex, correct }]);
      }
    });

    socket.on('duel:opponent_disconnected', () => {
      setStatus('finished');
    });
  };

  const submitAnswer = (duelId, userId, answer, time_ms, correct) => {
    const socket = getDuelSocket();
    const questionIndex = currentQ;
    socket.emit('duel:answer', { duelId, userId, questionIndex, answer, time_ms, correct });
    setMyAnswers(prev => [...prev, { questionIndex, answer, time_ms, correct, ki_earned: 0 }]);
    setCurrentQ(prev => prev + 1);
  };

  const activateShield = (duelId, userId) => {
    const socket = getDuelSocket();
    socket.emit('duel:shield_used', { duelId, userId });
  };

  const resetGame = () => {
    setDuel(null);
    setQuestions([]);
    setCurrentQ(0);
    setMyAnswers([]);
    setOpponentAnswers([]);
    setSurgeActive(false);
    setOpponentSurge(false);
    setStatus('idle');
    socketRef.current?.off('duel:surge_activated');
    socketRef.current?.off('duel:answer_received');
  };

  return (
    <GameContext.Provider value={{
      duel, setDuel,
      questions, setQuestions,
      currentQ, setCurrentQ,
      myAnswers, opponentAnswers,
      surgeActive, opponentSurge,
      status, setStatus,
      joinDuel, submitAnswer, activateShield, resetGame
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
