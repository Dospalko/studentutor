"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-3/4 bg-muted rounded-lg"></div>
            <div className="h-4 w-full bg-muted rounded mt-2"></div>
            <div className="h-4 w-5/6 bg-muted rounded mt-1"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-2 w-full bg-muted rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-10 w-full bg-muted rounded-lg"></div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
