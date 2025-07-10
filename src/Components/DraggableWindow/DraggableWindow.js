import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const DraggableContainer = styled.div`
  position: fixed;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  user-select: none;
  z-index: 10000;
`;

const DragHandle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px 12px 0 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const DragIndicator = styled.div`
  width: 20px;
  height: 4px;
  background: #9ca3af;
  border-radius: 2px;
  opacity: 0.5;
`;

const ContentWrapper = styled.div`
  padding-top: 20px;
`;

export const DraggableWindow = ({ children, initialPosition = { x: 20, y: 20 } }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    // Load saved position
    const savedPosition = localStorage.getItem('extension_position');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    }
  }, []);

  useEffect(() => {
    // Save position whenever it changes
    localStorage.setItem('extension_position', JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Constrain to viewport
    const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 400);
    const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 300);

    setPosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <DraggableContainer
      ref={containerRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: 'auto'
      }}
      isDragging={isDragging}
    >
      <DragHandle onMouseDown={handleMouseDown}>
        <DragIndicator />
      </DragHandle>
      <ContentWrapper>
        {children}
      </ContentWrapper>
    </DraggableContainer>
  );
};
