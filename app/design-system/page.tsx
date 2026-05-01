import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRightIcon, ChevronRightIcon } from "lucide-react"

export const metadata = {
  title: "Components — Design system",
  description: "Nova-preset component reference for internal product work.",
}

const iconProps = { size: 18 as const, strokeWidth: 1.5 as const }

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
      {children}
    </p>
  )
}

const specGrid =
  "grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 sm:items-start"

function SpecCategory({
  id,
  title,
  summary,
  children,
}: {
  id: string
  title: string
  summary: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 flex flex-col gap-4 rounded-md border border-border/60 bg-muted/5 p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-full bg-background font-sans">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-6">
        <header className="flex flex-col gap-2">
          <nav
            className="flex flex-wrap items-center gap-1 text-sm font-medium text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <span>Docs</span>
            <ChevronRightIcon {...iconProps} className="shrink-0 opacity-60" aria-hidden />
            <span className="text-foreground">Design system</span>
          </nav>
          <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight text-foreground">
            Components
          </h1>
          <p className="text-sm text-muted-foreground">
            Reference implementations aligned with the Nova preset—compact rhythm, neutral chrome,
            sharp edges.
          </p>
        </header>

        <SpecCategory
          id="actions"
          title="Actions"
          summary="Trigger states and hierarchy. Prefer outline in dense toolbars; default for primary commit."
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <FieldLabel>Variants</FieldLabel>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="lg">Default</Button>
                <Button size="lg" variant="secondary">
                  Secondary
                </Button>
                <Button size="lg" variant="outline">
                  Outline
                </Button>
                <Button size="lg" variant="ghost">
                  Ghost
                </Button>
                <Button size="lg" variant="destructive">
                  Destructive
                </Button>
                <Button size="lg" variant="link">
                  Link
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel>Sizes</FieldLabel>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <Button size="xs" variant="outline">
                    Extra small
                  </Button>
                  <Button size="icon-xs" variant="outline" aria-label="Extra small icon">
                    <ArrowUpRightIcon {...iconProps} />
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button size="sm" variant="outline">
                    Small
                  </Button>
                  <Button size="icon-sm" variant="outline" aria-label="Small icon">
                    <ArrowUpRightIcon {...iconProps} />
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button variant="outline">Default</Button>
                  <Button size="icon" variant="outline" aria-label="Default icon">
                    <ArrowUpRightIcon {...iconProps} />
                  </Button>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button variant="outline" size="lg">
                    Large
                  </Button>
                  <Button size="icon-lg" variant="outline" aria-label="Large icon">
                    <ArrowUpRightIcon {...iconProps} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SpecCategory>

        <SpecCategory
          id="forms"
          title="Forms"
          summary="Single-line inputs and scalar controls. Keep labels external; reserve vertical space for validation."
        >
          <div className={specGrid}>
            <div className="flex min-w-0 flex-col gap-2">
              <FieldLabel>Input</FieldLabel>
              <div className="flex flex-col gap-2">
                <Input type="email" placeholder="name@company.com" autoComplete="off" className="h-9" />
                <Input placeholder="Disabled" disabled className="h-9" />
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <FieldLabel>Slider</FieldLabel>
              <div className="flex flex-col gap-2">
                <Slider defaultValue={[42]} max={100} step={1} className="w-full" />
                <p className="text-sm text-muted-foreground">Value 42 of 100.</p>
              </div>
            </div>
          </div>
        </SpecCategory>

        <SpecCategory
          id="display"
          title="Display"
          summary="Surface framing and status chips. Cards stack metadata; badges annotate without stealing focus."
        >
          <div className={specGrid}>
            <div className="flex min-w-0 flex-col gap-2">
              <FieldLabel>Card</FieldLabel>
              <Card>
                <CardHeader>
                  <CardTitle className="font-sans leading-snug tracking-tight">
                    Title
                  </CardTitle>
                  <CardDescription className="font-sans text-sm leading-normal text-muted-foreground/70">
                    One line of supporting context.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-2">
                  <p className="font-sans text-sm leading-relaxed text-foreground/90">
                    Body copy for dashboards and settings panels.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="lg">
                    Action
                  </Button>
                </CardFooter>
              </Card>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <FieldLabel>Badge</FieldLabel>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="ghost">Ghost</Badge>
              </div>
            </div>
          </div>
        </SpecCategory>

        <SpecCategory
          id="navigation"
          title="Navigation"
          summary="Horizontal tabs for peer views. Pair with line variant when anchoring to a header rule."
        >
          <Tabs defaultValue="a" className="flex w-full min-w-0 flex-col gap-3">
            <TabsList variant="line" className="h-9 w-full justify-start gap-0 rounded-none p-0">
              <TabsTrigger value="a" className="rounded-none px-3">
                Overview
              </TabsTrigger>
              <TabsTrigger value="b" className="rounded-none px-3">
                Details
              </TabsTrigger>
              <TabsTrigger value="c" className="rounded-none px-3">
                Activity
              </TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="text-sm text-muted-foreground">
              Summary metrics and health—keep copy under two lines.
            </TabsContent>
            <TabsContent value="b" className="text-sm text-muted-foreground">
              Dense field grid; align to the system rhythm.
            </TabsContent>
            <TabsContent value="c" className="text-sm text-muted-foreground">
              Append-only lists: timestamp, actor, delta.
            </TabsContent>
          </Tabs>
        </SpecCategory>

        <SpecCategory
          id="disclosure"
          title="Disclosure"
          summary="Stacked panels for policy, billing, and security copy—collapse by default in settings flows."
        >
          <Accordion type="single" collapsible className="w-full min-w-0">
            <AccordionItem value="1">
              <AccordionTrigger>Shipping &amp; returns</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Link out for legal text; inline summaries only.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>Security</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Sessions, 2FA, and recovery—one paragraph each.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Billing</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Invoices, proration, payment methods.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SpecCategory>

        <footer>
          <p className="text-sm text-muted-foreground font-sans">
            radix-nova · <span className="text-foreground">components/ui</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
