import React, { useState } from "react";
import styled from "styled-components";
import { Title } from "./Components/Title/Title";
import { Summary } from "./Components/Summary/Summary";
import { History } from "./Components/History/History";
import { DraggableWindow } from "./Components/DraggableWindow/DraggableWindow";

const AppContainer = styled.div`
  width: 400px;
  height: auto;
  max-height: 500px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  overflow-y: auto;
  color: #111827;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
  margin-top: -8px;
`;

const Tab = styled.button`
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: ${props => props.active ? '#6366f1' : 'transparent'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.active ? '#5856eb' : '#f3f4f6'};
  }
`;

const MinimizeButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #6b7280;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #f3f4f6;
  }
`;

export const App = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <DraggableWindow initialPosition={{ x: window.innerWidth - 100, y: 20 }}>
        <div style={{ 
          background: '#6366f1', 
          color: 'white', 
          padding: '8px 16px', 
          borderRadius: '20px', 
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }} onClick={() => setIsMinimized(false)}>
          Grensa.AI
        </div>
      </DraggableWindow>
    );
  }

  return (
    <DraggableWindow>
      <AppContainer>
        <MinimizeButton onClick={() => setIsMinimized(true)}>
          −
        </MinimizeButton>
        
        <Title />
        
        <TabContainer>
          <Tab 
            active={activeTab === "summary"} 
            onClick={() => setActiveTab("summary")}
          >
            Резюме
          </Tab>
          <Tab 
            active={activeTab === "history"} 
            onClick={() => setActiveTab("history")}
          >
            История
          </Tab>
        </TabContainer>
        
        {activeTab === "summary" && <Summary />}
        {activeTab === "history" && <History />}
      </AppContainer>
    </DraggableWindow>
  );
};
