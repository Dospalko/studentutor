"use client"

import type { Topic } from "@/services/topicService"
import TopicListItem from "./TopicListItem"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, BookOpen, Sparkles} from "lucide-react"

interface Props {
  topics: Topic[]
  onEditTopic: (t: Topic) => void
  onDeleteTopic: (id: number) => void
  onOpenNewTopicDialog: () => void
  onTopicUpdate: (t: Topic) => void
}

export default function TopicList({ topics, onEditTopic, onDeleteTopic, onOpenNewTopicDialog, onTopicUpdate }: Props) {
  const sorted = [...topics].sort((a, b) => a.name.localeCompare(b.name))


  return (
    <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-lg">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Témy predmetu
              </CardTitle>
            
            </div>
          </div>
          <Button onClick={onOpenNewTopicDialog} size="lg" className="group shadow-lg">
            <PlusCircle className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
            Pridať tému
          </Button>
        </div>

       
      </CardHeader>

      <CardContent>
        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-muted/20">
            <div className="max-w-md mx-auto">
              <div className="mb-8 relative">
                <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center shadow-lg">
                  <BookOpen className="w-12 h-12 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-secondary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Tento predmet zatiaľ nemá žiadne témy</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                Začnite pridaním prvej témy vrátane svojich silných a slabých stránok pre lepšie AI odporúčania.
              </p>
              <Button onClick={onOpenNewTopicDialog} size="lg" className="group shadow-lg">
                <PlusCircle className="mr-2 h-6 w-6 transition-transform group-hover:rotate-90" />
                Pridať prvú tému
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
