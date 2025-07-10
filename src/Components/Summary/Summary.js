import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { openaiService } from "../../services/openai";
import { telegramParser } from "../../services/telegramParser";
import { saveSummaryToHistory } from "../History/History";

const Container = styled.div`
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #6366f1;
`;

const SummaryTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Text = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
`;

const ErrorText = styled.p`
  margin: 0;
  color: #dc2626;
  font-size: 14px;
  line-height: 1.5;
`;

const ConfigSection = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 8px;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;

const Button = styled.button`
  background: #6366f1;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #5856eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  border: 2px solid #f3f4f6;
  border-top: 2px solid #6366f1;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: ${spin} 1s linear infinite;
`;

const MessagesCount = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const DebugInfo = styled.div`
  font-size: 11px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  max-height: 100px;
  overflow-y: auto;
  white-space: pre-wrap;
`;

export const Summary = () => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Load saved API key
    const savedKey = localStorage.getItem("openai_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      openaiService.setApiKey(savedKey);
      setIsConfigured(true);
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) return;

    const handleChatChange = () => {
      generateSummary();
    };

    // Initial summary generation
    generateSummary();

    // Set up observers for chat changes
    telegramParser.observeChatChanges(handleChatChange);

    return () => {
      telegramParser.disconnect();
    };
  }, [isConfigured]);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      setError("Please enter a valid API key");
      return;
    }
    
    localStorage.setItem("openai_api_key", apiKey);
    openaiService.setApiKey(apiKey);
    setIsConfigured(true);
    setError("");
  };

  const generateSummary = async () => {
    if (!isConfigured) return;

    setLoading(true);
    setError("");

    try {
      // Parse messages from current chat
      const parsedMessages = telegramParser.parseMessages();
      setMessages(parsedMessages);

      console.log('Parsed messages:', parsedMessages);

      if (parsedMessages.length === 0) {
        setSummary("No messages found in this chat. Please select a chat with messages.");
        return;
      }

      if (parsedMessages.length < 3) {
        setSummary("Too few messages to generate a meaningful summary. Please select a chat with more messages.");
        return;
      }

      // Generate summary using OpenAI
      const generatedSummary = await openaiService.generateSummary(parsedMessages);
      setSummary(generatedSummary);
      
      // Save to history
      const chatId = telegramParser.getCurrentChatId();
      saveSummaryToHistory(generatedSummary, chatId, parsedMessages.length);
    } catch (err) {
      console.error('Summary generation error:', err);
      
      // Better error messages
      if (err.message.includes('quota') || err.message.includes('exceeded')) {
        setError("OpenAI API quota exceeded. Please check your billing and usage at https://platform.openai.com/account/usage");
      } else if (err.message.includes('invalid') || err.message.includes('unauthorized')) {
        setError("Invalid API key. Please check your OpenAI API key configuration.");
      } else {
        setError(`Error: ${err.message}`);
      }
      
      setSummary("");
    } finally {
      setLoading(false);
    }
  };

  const resetConfig = () => {
    localStorage.removeItem("openai_api_key");
    setApiKey("");
    setIsConfigured(false);
    setSummary("");
    setError("");
  };

  if (!isConfigured) {
    return (
      <Container>
        <SummaryTitle>Configuration</SummaryTitle>
        <ConfigSection>
          <Input
            type="password"
            placeholder="Enter your OpenAI API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && saveApiKey()}
          />
          <Button onClick={saveApiKey}>Save API Key</Button>
          {error && <ErrorText>{error}</ErrorText>}
        </ConfigSection>
        <Text>
          Please enter your OpenAI API key to start generating chat summaries.
        </Text>
      </Container>
    );
  }

  return (
    <Container>
      <SummaryTitle>
        Резюме
        {loading && <Spinner />}
      </SummaryTitle>
      
      {messages.length > 0 && (
        <MessagesCount>
          Parsed {messages.length} messages
        </MessagesCount>
      )}
      
      {showDebug && messages.length > 0 && (
        <DebugInfo>
          Debug Info (first 3 messages):
          {messages.slice(0, 3).map((msg, i) => 
            `\n${i + 1}. [${msg.author}]: ${msg.text.substring(0, 100)}...`
          )}
        </DebugInfo>
      )}
      
      {error && <ErrorText>{error}</ErrorText>}
      
      {summary && <Text>{summary}</Text>}
      
      {!loading && !summary && !error && (
        <Text>Select a chat to generate summary.</Text>
      )}
      
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af' }}>
        <Button 
          onClick={generateSummary} 
          disabled={loading}
          style={{ marginRight: '8px', fontSize: '12px', padding: '4px 8px' }}
        >
          Refresh
        </Button>
        {/* <Button 
          onClick={() => setShowDebug(!showDebug)}
          style={{ marginRight: '8px', fontSize: '12px', padding: '4px 8px', background: '#10b981' }}
        >
          {showDebug ? 'Hide' : 'Show'} Debug
        </Button> */}
        <Button 
          onClick={resetConfig}
          style={{ fontSize: '12px', padding: '4px 8px', background: '#6b7280' }}
        >
          Reset Config
        </Button>
      </div>
    </Container>
  );
};
