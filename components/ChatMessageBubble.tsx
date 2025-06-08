import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import { FormattedMessage } from "./FormattedMessage";

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  sources: any[];
}) {
  return (
    <div
      className={cn(
        `rounded-2xl max-w-[85%] mb-6 flex gap-3`,
        props.message.role === "user"
          ? "bg-primary text-primary-foreground px-4 py-3 ml-auto rounded-br-md"
          : "mr-auto",
      )}
    >
      {props.message.role !== "user" && (
        <div className="border bg-secondary rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm mt-1">
          {props.aiEmoji || "🤖"}
        </div>
      )}

      <div className="flex flex-col min-w-0 flex-1">
        {props.message.role === "user" ? (
          <div className="whitespace-pre-wrap text-primary-foreground">
            {props.message.content}
          </div>
        ) : (
          <FormattedMessage 
            content={props.message.content} 
            className="text-foreground"
          />
        )}

        {props.sources && props.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                🔍 Sources ({props.sources.length})
              </span>
            </div>
            <div className="space-y-2">
              {props.sources.map((source, i) => (
                <div 
                  key={`source:${i}`}
                  className="bg-muted/30 rounded-lg p-3 border border-border/20 text-sm"
                >
                  <div className="text-muted-foreground mb-1 font-medium">
                    Source {i + 1}
                  </div>
                  <div className="text-foreground italic">
                    "{source.pageContent}"
                  </div>
                  {source.metadata?.loc?.lines !== undefined && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Lines {source.metadata.loc.lines.from} - {source.metadata.loc.lines.to}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
