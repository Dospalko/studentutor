"use client";

import type { Topic } from "@/services/topicService";
import TopicListItem from "./TopicListItem";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, BookOpen, Sparkles } from "lucide-react";

interface Props {
  topics: Topic[];
  onEditTopic: (t: Topic) => void;
  onDeleteTopic: (id: number) => void;
  onOpenNewTopicDialog: () => void;
  onTopicUpdate: (t: Topic) => void;
}

export default function TopicList({
  topics,
  onEditTopic,
  onDeleteTopic,
  onOpenNewTopicDialog,
  onTopicUpdate,
}: Props) {
  const sorted = [...topics].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Card className="mb-8 border-muted/40">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Témy predmetu</CardTitle>
              {sorted.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {sorted.length} tém celkom
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <Button onClick={onOpenNewTopicDialog} className="group">
            <PlusCircle className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            Pridať tému
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((t, i) => (
              <div
                key={t.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <TopicListItem
                  topic={t}
                  onEdit={() => onEditTopic(t)}
                  onDelete={() => onDeleteTopic(t.id)}
                  onTopicUpdate={onTopicUpdate}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-xl bg-muted/20">
            <div className="max-w-md mx-auto">
              <div className="mb-6 relative">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Tento predmet zatiaľ nemá žiadne témy
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Začnite pridaním prvej témy vrátane svojich silných a slabých stránok.
              </p>
              <Button onClick={onOpenNewTopicDialog} size="lg" className="group">
                <PlusCircle className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                Pridať prvú tému
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
