import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #10b981;
  max-height: 300px;
  overflow-y: auto;
`;

const HistoryTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HistoryItem = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const HistoryDate = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const HistoryText = styled.div`
  font-size: 14px;
  color: #111827;
  line-height: 1.4;
`;

const ChatInfo = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
  font-style: italic;
`;

const Button = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background: #dc2626;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  padding: 20px;
`;

export const History = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = localStorage.getItem('summaries_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('summaries_history');
    setHistory([]);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (history.length === 0) {
    return (
      <Container>
        <HistoryTitle>История резюме</HistoryTitle>
        <EmptyState>
          История пуста. Сгенерируйте резюме чата, чтобы увидеть его здесь.
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <HistoryTitle>
        История резюме
        <Button onClick={clearHistory}>Очистить</Button>
      </HistoryTitle>
      
      {history.map((item) => (
        <HistoryItem key={item.id}>
          <HistoryDate>{formatDate(item.timestamp)}</HistoryDate>
          <ChatInfo>
            {item.chatId ? `Chat: ${item.chatId}` : 'Unknown chat'} • {item.messageCount} сообщений
          </ChatInfo>
          <HistoryText>{item.summary}</HistoryText>
        </HistoryItem>
      ))}
    </Container>
  );
};

// Utility function to save summary to history
export const saveSummaryToHistory = (summary, chatId, messageCount) => {
  const historyItem = {
    id: Date.now(),
    timestamp: Date.now(),
    summary,
    chatId,
    messageCount
  };

  const existingHistory = JSON.parse(localStorage.getItem('summaries_history') || '[]');
  const updatedHistory = [historyItem, ...existingHistory].slice(0, 50); // Keep only last 50 items
  
  localStorage.setItem('summaries_history', JSON.stringify(updatedHistory));
};
