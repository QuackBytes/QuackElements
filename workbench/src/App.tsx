import { Alert, AlertDescription, AlertTitle } from "@/components/quack/alert"
import { Badge } from "@/components/quack/badge"
import { AetherGrid } from "@/components/quack/backgrounds/aether-grid"
import { PrismTiles } from "@/components/quack/backgrounds/prism-tiles"
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
            <span className="text-sm text-muted-foreground">61 components · 2 backgrounds · preset b2tqESkd9c</span>
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

        <section className="grid gap-3">
          <div>
            <p className="text-sm font-medium text-amber-500">Backgrounds</p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">Aether Grid</h2>
          </div>
          <AetherGrid
            className="min-h-[420px] rounded-2xl border border-white/10"
            origin="right"
            color="#f59e0b"
          >
            <div className="flex min-h-[420px] max-w-xl flex-col justify-center gap-5 p-10 text-white md:p-14">
              <Badge className="w-fit border-amber-400/20 bg-amber-400/10 text-amber-300">
                Original QuackElements background
              </Badge>
              <h3 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
                Digital light, shaped like a night sky.
              </h3>
              <p className="max-w-md text-base leading-7 text-white/60">
                A deterministic field of square stars with directional density, individual shimmer,
                and reduced-motion support.
              </p>
            </div>
          </AetherGrid>
        </section>

        <section className="grid gap-3">
          <div>
            <p className="text-sm font-medium text-fuchsia-400">Backgrounds</p>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">Prism Tiles</h2>
          </div>
          <PrismTiles className="min-h-[420px] rounded-2xl border border-white/10" />
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
