import React from 'react';
import './App.css';
import ArrowGame from './components/ArrowGame';
import HeartAnimation from './components/HeartAnimation';
import TributeText from './components/TributeText';

function App() {
  return (
    <div className="App">
      <TributeText />
      <HeartAnimation />
      <ArrowGame />
    </div>
  );
}

export default App;