import { Alert, AlertDescription, AlertTitle } from "@/components/quack/alert"
import { Badge } from "@/components/quack/badge"
import { Button } from "@/components/quack/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/quack/card"
import { Checkbox } from "@/components/quack/checkbox"
import { Input } from "@/components/quack/input"
import { Label } from "@/components/quack/label"
import { Switch } from "@/components/quack/switch"
import { Textarea } from "@/components/quack/textarea"

function App() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3 border-b pb-8">
          <div className="flex items-center gap-3">
            <Badge>QuackElements</Badge>
            <span className="text-sm text-muted-foreground">61 components · preset b2tqESkd9c</span>
          </div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">Component workbench</h1>
          <p className="max-w-2xl text-muted-foreground">
            Customize components under <code>src/components/quack</code>, then run <code>npm run sync</code> from the package root.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Core button variants from the current QuackElements baseline.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form controls</CardTitle>
              <CardDescription>Inputs share the neutral theme and focus treatment.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="workbench-name">Project name</Label>
                <Input id="workbench-name" defaultValue="QuackElements" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="workbench-notes">Notes</Label>
                <Textarea id="workbench-notes" placeholder="Write customization notes..." />
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="workbench-open-source" defaultChecked />
                <Label htmlFor="workbench-open-source">Open-source distribution</Label>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label htmlFor="workbench-dark-mode">Dark-mode ready</Label>
                <Switch id="workbench-dark-mode" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </section>

        <Alert>
          <AlertTitle>Ready to customize</AlertTitle>
          <AlertDescription>
            The installer, source paths, utility function and data attributes now use the QuackElements namespace.
          </AlertDescription>
        </Alert>
      </div>
    </main>
  )
}

export default App
