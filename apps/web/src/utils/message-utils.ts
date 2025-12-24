/**
 * Message and Rich Text utilities
 * Handles conversion between rich text nodes and markdown
 */

export interface RichTextNode {
  type: string
  children?: RichTextNode[]
  text?: string
  [key: string]: any
}

export interface MessageBlock {
  type: 'paragraph' | 'heading' | 'list' | 'code-block' | 'quote'
  level?: number
  content: string
  children?: MessageBlock[]
}

export const messageUtils = {
  /**
   * Create an empty paragraph element for rich text editor
   */
  createEmptyParagraphElement: (): RichTextNode => ({
    type: 'paragraph',
    children: [{ text: '' }]
  }),

  /**
   * Convert message blocks to markdown string
   */
  toMarkdown: (blocks: MessageBlock[]): string => {
    return blocks.map(block => {
      switch (block.type) {
        case 'heading':
          return `${'#'.repeat(block.level || 1)} ${block.content}\n`

        case 'paragraph':
          return `${block.content}\n`

        case 'code-block':
          return `\`\`\`\n${block.content}\n\`\`\`\n`

        case 'quote':
          return block.content.split('\n').map(line => `> ${line}`).join('\n') + '\n'

        case 'list':
          if (block.children) {
            return block.children.map((child, i) =>
              `${i + 1}. ${child.content}`
            ).join('\n') + '\n'
          }
          return ''

        default:
          return block.content + '\n'
      }
    }).join('\n')
  },

  /**
   * Parse markdown to message blocks
   */
  toMessageBlocks: (markdown: string): MessageBlock[] => {
    const lines = markdown.split('\n')
    const blocks: MessageBlock[] = []
    let currentBlock: MessageBlock | null = null

    for (const line of lines) {
      // Heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        if (currentBlock) blocks.push(currentBlock)
        currentBlock = {
          type: 'heading',
          level: headingMatch[1].length,
          content: headingMatch[2]
        }
        continue
      }

      // Code block
      if (line.trim() === '```') {
        if (currentBlock?.type === 'code-block') {
          blocks.push(currentBlock)
          currentBlock = null
        } else {
          if (currentBlock) blocks.push(currentBlock)
          currentBlock = { type: 'code-block', content: '' }
        }
        continue
      }

      if (currentBlock?.type === 'code-block') {
        currentBlock.content += (currentBlock.content ? '\n' : '') + line
        continue
      }

      // Quote
      const quoteMatch = line.match(/^>\s+(.+)$/)
      if (quoteMatch) {
        if (currentBlock?.type === 'quote') {
          currentBlock.content += '\n' + quoteMatch[1]
        } else {
          if (currentBlock) blocks.push(currentBlock)
          currentBlock = { type: 'quote', content: quoteMatch[1] }
        }
        continue
      }

      // List item
      const listMatch = line.match(/^(\d+)\.\s+(.+)$/)
      if (listMatch) {
        if (currentBlock?.type === 'list') {
          currentBlock.children?.push({ type: 'paragraph', content: listMatch[2] })
        } else {
          if (currentBlock) blocks.push(currentBlock)
          currentBlock = {
            type: 'list',
            content: '',
            children: [{ type: 'paragraph', content: listMatch[2] }]
          }
        }
        continue
      }

      // Empty line - finalize current block
      if (line.trim() === '') {
        if (currentBlock) {
          blocks.push(currentBlock)
          currentBlock = null
        }
        continue
      }

      // Regular paragraph
      if (currentBlock?.type === 'paragraph') {
        currentBlock.content += ' ' + line
      } else {
        if (currentBlock) blocks.push(currentBlock)
        currentBlock = { type: 'paragraph', content: line }
      }
    }

    if (currentBlock) blocks.push(currentBlock)
    return blocks
  },

  /**
   * Check if a rich text node is empty
   */
  isNodeEmpty: (node: RichTextNode): boolean => {
    if (node.text !== undefined) {
      return node.text.trim() === ''
    }
    if (node.children) {
      return node.children.every(messageUtils.isNodeEmpty)
    }
    return true
  },

  /**
   * Extract plain text from rich text nodes
   */
  toPlainText: (nodes: RichTextNode[]): string => {
    return nodes.map(node => {
      if (node.text !== undefined) return node.text
      if (node.children) return messageUtils.toPlainText(node.children)
      return ''
    }).join('')
  },

  /**
   * Convert Slate Descendant[] to markdown string
   * Handles the Slate format with type and children structure
   */
  descendantsToMarkdown: (nodes: RichTextNode[]): string => {
    const extractText = (node: RichTextNode): string => {
      if (node.text !== undefined) {
        return node.text
      }
      if (node.children) {
        return node.children.map(extractText).join('')
      }
      return ''
    }

    const result = nodes.map(node => {
      const text = extractText(node).trim()
      const type = node.type || 'paragraph'

      switch (type) {
        case 'heading-one':
          return text ? `# ${text}\n\n` : ''
        case 'heading-two':
          return text ? `## ${text}\n\n` : ''
        case 'heading-three':
          return text ? `### ${text}\n\n` : ''
        case 'code-block':
          return text ? `\`\`\`\n${text}\n\`\`\`\n\n` : ''
        case 'block-quote':
          return text ? text.split('\n').map(line => `> ${line}`).join('\n') + '\n\n' : ''
        case 'bulleted-list':
        case 'numbered-list':
          // For lists, we'd need to handle list-item children
          // For now, just return the text
          return text ? `${text}\n\n` : ''
        case 'list-item':
          return text ? `- ${text}\n` : ''
        case 'paragraph':
        default:
          return text ? `${text}\n\n` : ''
      }
    }).filter(Boolean).join('')

    // Return empty string if no content, otherwise trim trailing newlines but keep at least one
    return result.trim() || ''
  }
}
