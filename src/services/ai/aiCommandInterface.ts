/**
 * AI Command Interface Boundary
 * Prepared for Part 04 Voice & Gesture Control (Section 40)
 * Allows Teaching Studio to dispatch natural language or semantic commands.
 */

export type TeachingCommandAction =
  | 'next_slide'
  | 'prev_slide'
  | 'goto_slide'
  | 'open_node'
  | 'expand_mindmap'
  | 'explain_concept'
  | 'create_question'
  | 'start_quiz'
  | 'toggle_whiteboard'
  | 'focus_source';

export interface TeachingStudioCommand {
  rawUtterance: string;
  action: TeachingCommandAction;
  targetId?: string;
  targetLabel?: string;
  parameters?: Record<string, unknown>;
  timestamp: number;
}

export interface IAICommandDispatcher {
  registerCommandHandler(action: TeachingCommandAction, handler: (cmd: TeachingStudioCommand) => void): () => void;
  dispatchCommand(command: TeachingStudioCommand): boolean;
  parseTextCommand(text: string): TeachingStudioCommand | null;
}

class AICommandDispatcher implements IAICommandDispatcher {
  private handlers = new Map<TeachingCommandAction, ((cmd: TeachingStudioCommand) => void)[]>();

  public registerCommandHandler(
    action: TeachingCommandAction,
    handler: (cmd: TeachingStudioCommand) => void
  ): () => void {
    const list = this.handlers.get(action) || [];
    list.push(handler);
    this.handlers.set(action, list);

    return () => {
      const current = this.handlers.get(action) || [];
      this.handlers.set(action, current.filter((h) => h !== handler));
    };
  }

  public dispatchCommand(command: TeachingStudioCommand): boolean {
    const list = this.handlers.get(command.action);
    if (!list || list.length === 0) return false;
    list.forEach((h) => h(command));
    return true;
  }

  public parseTextCommand(text: string): TeachingStudioCommand | null {
    const clean = text.trim().toLowerCase();
    const now = Date.now();

    if (clean.includes('next slide') || clean === 'next') {
      return { rawUtterance: text, action: 'next_slide', timestamp: now };
    }
    if (clean.includes('prev slide') || clean.includes('previous slide') || clean === 'back') {
      return { rawUtterance: text, action: 'prev_slide', timestamp: now };
    }
    if (clean.startsWith('open ') || clean.startsWith('select ')) {
      const target = text.replace(/^(open|select)\s+/i, '').trim();
      return { rawUtterance: text, action: 'open_node', targetLabel: target, timestamp: now };
    }
    if (clean.includes('explain this') || clean.includes('explain more')) {
      return { rawUtterance: text, action: 'explain_concept', timestamp: now };
    }
    if (clean.includes('create question') || clean.includes('ask question')) {
      return { rawUtterance: text, action: 'create_question', timestamp: now };
    }

    return null;
  }
}

export const aiCommandDispatcher = new AICommandDispatcher();
