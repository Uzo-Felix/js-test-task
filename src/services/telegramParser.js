export class TelegramParser {
  constructor() {
    this.lastChatId = null;
    this.observers = [];
  }

  // Get current chat ID from URL or DOM
  getCurrentChatId() {
    const url = window.location.href;
    const match = url.match(/\/([^\/]+)$/);
    return match ? match[1] : null;
  }

  // Parse messages from the current chat
  parseMessages() {
    const messages = [];
    
    console.log('Starting message parsing...');
    
    // Wait for chat to load
    if (!this.isChatLoaded()) {
      console.log('Chat not loaded yet');
      return messages;
    }
    
    // Try multiple selector strategies - focusing on actual chat messages
    const selectorStrategies = [
      // Strategy 1: Specific message bubbles in chat area
      {
        name: 'Chat Messages',
        selectors: [
          '.messages-container .message:not(.menu-container)',
          '.chat .message:not(.menu-container)',
          '.messages .message:not(.menu-container)',
          '.message-list .message:not(.menu-container)'
        ]
      },
      // Strategy 2: Bubble messages (excluding menus)
      {
        name: 'Message Bubbles',
        selectors: [
          '.bubble:not(.menu-container):not(.dropdown):not(.popup)',
          '.message-bubble:not(.menu-container)',
          '.chat-bubble:not(.menu-container)',
          '.bubble.message:not(.menu-container)'
        ]
      },
      // Strategy 3: Data attributes for messages
      {
        name: 'Message Data',
        selectors: [
          '[data-message-id]',
          '[data-message]:not([class*="menu"])',
          '.message[data-peer-id]',
          '.message[data-mid]'
        ]
      },
      // Strategy 4: Telegram-specific classes
      {
        name: 'Telegram Specific',
        selectors: [
          '.message.own, .message.is-own',
          '.message.is-selected',
          '.message.is-highlighted',
          '.message:not(.service):not(.system)'
        ]
      }
    ];

    let messageElements = [];
    let usedStrategy = null;

    for (const strategy of selectorStrategies) {
      console.log(`Trying ${strategy.name} strategy...`);
      
      for (const selector of strategy.selectors) {
        messageElements = document.querySelectorAll(selector);
        if (messageElements.length > 0) {
          console.log(`Found ${messageElements.length} elements with selector: ${selector}`);
          usedStrategy = strategy.name;
          break;
        }
      }
      
      if (messageElements.length > 0) break;
    }

    if (messageElements.length === 0) {
      console.log('No message elements found with any strategy, trying fallback...');
      
      // Fallback: Look for any elements that might contain chat messages
      const fallbackElements = document.querySelectorAll('[class*="message"], [class*="bubble"], [class*="chat"]');
      console.log(`Fallback found ${fallbackElements.length} potential elements`);
      
      // Filter fallback elements more aggressively
      const validFallback = Array.from(fallbackElements).filter(el => {
        if (el.classList.contains('menu-container') || 
            el.classList.contains('dropdown') ||
            el.classList.contains('popup') ||
            el.classList.contains('modal') ||
            el.classList.contains('sidebar') ||
            el.classList.contains('header') ||
            el.classList.contains('footer')) {
          return false;
        }
        
        const text = el.textContent?.trim();
        return text && text.length > 10 && text.length < 1000;
      });
      
      if (validFallback.length === 0) {
        console.log('No valid fallback elements found');
        return messages;
      }
      
      messageElements = validFallback;
      usedStrategy = 'Fallback';
    }

    console.log(`Using ${usedStrategy} strategy, found ${messageElements.length} elements`);

    // Convert to array and apply basic filtering
    const elementsArray = Array.from(messageElements);
    
    // Apply aggressive filtering to exclude UI elements
    const filteredElements = elementsArray.filter(el => {
      // Skip menu containers and UI elements
      if (el.classList.contains('menu-container') ||
          el.classList.contains('dropdown') ||
          el.classList.contains('popup') ||
          el.classList.contains('modal') ||
          el.classList.contains('service') || 
          el.classList.contains('system') ||
          el.classList.contains('notification') ||
          el.classList.contains('date-divider') ||
          el.classList.contains('typing') ||
          el.classList.contains('loading') ||
          el.classList.contains('sidebar') ||
          el.classList.contains('header') ||
          el.classList.contains('footer')) {
        return false;
      }
      
      // Check for menu-specific class patterns
      const classList = el.className || '';
      if (classList.includes('menu') || 
          classList.includes('dropdown') ||
          classList.includes('popup') ||
          classList.includes('overlay') ||
          classList.includes('modal')) {
        return false;
      }
      
      const text = el.textContent?.trim();
      if (!text || text.length < 1) return false;
      
      // Skip UI button patterns
      if (text.match(/^(Send|Reply|Forward|Delete|Edit|More|⋮|▼|▲|✓|✓✓|:|•|New Channel|New Group|New Message|Send message as|Mark all as read|Send Without Sound|Schedule Message|PhotoFileChecklist|Add Account|Saved Messages|Contact|Switch to|Install App|Telegram Web|Night Mode|Popular)$/i)) {
        return false;
      }
      
      // Skip very long concatenated UI text (like your emoji menu)
      if (text.length > 500) {
        return false;
      }
      
      // Skip text that looks like concatenated UI elements
      if (text.match(/Add\+\d+|IconsAdd|Christmas IconsAdd|Love IconsAdd/)) {
        return false;
      }
      
      // Skip text with lots of consecutive capitals (UI elements)
      if (text.match(/[A-Z]{10,}/)) {
        return false;
      }
      
      // Must be in the main chat area, not a menu
      const chatContainer = el.closest('.messages-container, .chat, .message-list');
      if (!chatContainer) {
        return false;
      }
      
      return true;
    });

    console.log(`After filtering: ${filteredElements.length} elements`);

    // Extract message data from filtered elements
    for (const element of filteredElements) {
      const messageData = this.extractMessageData(element);
      if (messageData && messageData.text && messageData.text.length >= 1) {
        messages.push(messageData);
      }
    }

    console.log(`Extracted ${messages.length} messages`);

    // Remove duplicates based on text content and author
    const uniqueMessages = messages.filter((msg, index, self) => 
      index === self.findIndex(m => 
        m.text === msg.text && m.author === msg.author
      )
    );

    console.log(`After deduplication: ${uniqueMessages.length} unique messages`);

    // Sort messages by timestamp if available
    return uniqueMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  // Check if chat is loaded and has content
  isChatLoaded() {
    // Check if we're in a chat conversation (not just on main page)
    const chatHeader = document.querySelector('.chat-header, .topbar, .header, [class*="header"], [class*="Header"]');
    const messagesContainer = document.querySelector('.messages-container, .message-list, .messages, [class*="messages"], [class*="Messages"]');
    
    console.log('Chat loading check:', {
      chatHeader: !!chatHeader,
      messagesContainer: !!messagesContainer,
      url: window.location.href
    });
    
    // Be more lenient - if we can't find specific elements, assume it's loaded
    return true; // Let's try without this check for now
  }

  // Extract message data from DOM element
  extractMessageData(element) {
    let textContent = element.textContent?.trim();
    if (!textContent || textContent.length === 0) return null;

    // Try to find the actual message text (not including author, time, etc.)
    const messageTextSelectors = [
      '.message-text',
      '.text',
      '.bubble-content',
      '.message-body',
      '.content',
      '[class*="text"]',
      '[class*="content"]'
    ];

    let foundSpecificText = false;
    for (const selector of messageTextSelectors) {
      const textElement = element.querySelector(selector);
      if (textElement) {
        const messageText = textElement.textContent?.trim();
        if (messageText && messageText.length > 0) {
          textContent = messageText;
          foundSpecificText = true;
          break;
        }
      }
    }

    // Try to find author name
    let author = 'User';
    const authorSelectors = [
      '.message-author',
      '.message-name',
      '.user-name',
      '.author',
      '.name',
      '[class*="author"]',
      '[class*="name"]',
      '[class*="username"]'
    ];

    for (const selector of authorSelectors) {
      const authorElement = element.querySelector(selector);
      if (authorElement) {
        const authorText = authorElement.textContent?.trim();
        if (authorText && authorText.length > 0 && authorText.length < 50) {
          author = authorText;
          break;
        }
      }
    }

    // Try to find timestamp
    let timestamp = Date.now();
    const timeSelectors = [
      '.message-time',
      '.time',
      '[class*="time"]',
      '[datetime]',
      'time'
    ];

    for (const selector of timeSelectors) {
      const timeElement = element.querySelector(selector);
      if (timeElement) {
        const timeText = timeElement.textContent?.trim();
        const dateTimeAttr = timeElement.getAttribute('datetime');
        
        if (dateTimeAttr) {
          const parsed = new Date(dateTimeAttr).getTime();
          if (!isNaN(parsed)) {
            timestamp = parsed;
            break;
          }
        } else if (timeText) {
          // Try to parse time
          const parsed = new Date(timeText).getTime();
          if (!isNaN(parsed)) {
            timestamp = parsed;
            break;
          }
        }
      }
    }

    // Clean up text content
    let cleanedText = textContent;
    
    // If we found specific text element, use it as-is
    if (!foundSpecificText) {
      // Remove author name from beginning if present
      if (author !== 'User' && cleanedText.startsWith(author)) {
        cleanedText = cleanedText.substring(author.length).trim();
      }
      
      // Remove common UI elements from the text
      cleanedText = cleanedText.replace(/^(Reply|Forward|Edit|Delete|More|⋮|▼|▲|✓|✓✓)\s*/, '');
      cleanedText = cleanedText.replace(/\s*(Reply|Forward|Edit|Delete|More|⋮|▼|▲|✓|✓✓)$/, '');
      
      // Remove timestamps from the text
      cleanedText = cleanedText.replace(/\s*\d{1,2}:\d{2}(\s*(AM|PM))?\s*$/, '');
    }

    cleanedText = cleanedText.trim();

    // Final validation - be more lenient
    if (!cleanedText || cleanedText.length < 1) {
      return null;
    }

    // Skip if it's just a timestamp
    if (cleanedText.match(/^\d{1,2}:\d{2}(\s*(AM|PM))?$/i)) {
      return null;
    }

    return {
      text: cleanedText,
      author,
      timestamp,
      element
    };
  }

  // Check if chat has changed
  haschatChanged() {
    const currentChatId = this.getCurrentChatId();
    if (this.lastChatId !== currentChatId) {
      this.lastChatId = currentChatId;
      return true;
    }
    return false;
  }

  // Set up observers for chat changes
  observeChatChanges(callback) {
    // URL change observer
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        callback();
      }
    });

    // DOM change observer
    const domObserver = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if messages container changed
          const hasMessageChanges = Array.from(mutation.addedNodes).some(node => 
            node.nodeType === 1 && (
              node.classList?.contains('message') || 
              node.querySelector?.('.message') ||
              node.classList?.toString().includes('message')
            )
          );
          
          if (hasMessageChanges) {
            shouldUpdate = true;
          }
        }
      });

      if (shouldUpdate) {
        callback();
      }
    });

    // Start observing
    urlObserver.observe(document.body, { childList: true, subtree: true });
    domObserver.observe(document.body, { childList: true, subtree: true });

    this.observers.push(urlObserver, domObserver);
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const telegramParser = new TelegramParser();
