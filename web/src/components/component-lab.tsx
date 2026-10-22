"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageIntro } from "@/components/page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { chromeCopy } from "@/lib/copy";
import { useLanguage } from "@/lib/i18n";

const swatches = [
  ["paper", "bg-paper", "#F4F0E6"],
  ["ink", "bg-ink", "#1A1814"],
  ["field", "bg-field", "#E7E1D6"],
  ["rule", "bg-rule", "#D9D1C3"],
  ["signal", "bg-signal", "#9E2B1F"],
  ["clear", "bg-clear", "#2F5D45"],
  ["hold", "bg-hold", "#8A5A12"],
  ["graphite", "bg-graphite", "#1C1917"],
] as const;

const typeScale = [
  ["Display", "text-6xl", "64px"],
  ["H1", "text-5xl", "48px"],
  ["H2", "text-4xl", "36px"],
  ["H3", "text-2xl", "24px"],
  ["Body", "text-base", "16px"],
  ["Small", "text-sm", "14px"],
  ["Mono", "font-mono text-sm", "14px"],
] as const;

const radii = [
  ["sm", "rounded-sm"],
  ["md", "rounded-md"],
  ["lg", "rounded-lg"],
  ["xl", "rounded-xl"],
  ["2xl", "rounded-2xl"],
  ["3xl", "rounded-3xl"],
] as const;

export function ComponentLab() {
  const { lang } = useLanguage();
  const copy = chromeCopy[lang];

  return (
    <div className="min-h-full bg-paper">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:px-8">
        <PageIntro
          kicker={copy.componentsPage.kicker}
          title={copy.componentsPage.title}
          body={copy.componentsPage.body}
        />

        <section className="grid gap-4">
          <h2 className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
            {copy.componentsPage.palette}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {swatches.map(([name, tone, hex]) => (
              <div key={name} className="overflow-hidden rounded-xl border border-rule bg-card">
                <div className={`h-16 ${tone}`} />
                <p className="px-3 py-2 font-mono text-xs">
                  {copy.palette[name]} · {hex}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
            {copy.componentsPage.type}
          </h2>
          <div className="grid gap-3 rounded-2xl border border-rule bg-card p-5">
            {typeScale.map(([label, className, size]) => (
              <div key={label} className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3 last:border-0 last:pb-0">
                <span className={`${className} leading-none`}>{label}</span>
                <span className="font-mono text-xs text-muted-foreground">{size}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
            {copy.componentsPage.radius}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {radii.map(([label, className]) => (
              <div key={label} className={`grid h-24 place-items-center border border-rule bg-card font-mono text-sm ${className}`}>
                {label}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{copy.componentsPage.note}</p>
        </section>

        <section className="grid gap-4">
          <h2 className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
            {copy.componentsPage.states}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
            <Button className="ring-2 ring-signal ring-offset-2">Focus</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>real</Badge>
            <Badge variant="secondary">insufficient</Badge>
            <Badge variant="outline">clear</Badge>
            <Badge variant="ghost">pending_human</Badge>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>{copy.componentsPage.forms}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lab-search">Search</Label>
                <Input id="lab-search" placeholder="STOP_01" />
              </div>
              <div className="grid gap-2">
                <Label>Scenario</Label>
                <Select defaultValue="scn-block">
                  <SelectTrigger className="min-h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scn-block">scn-block</SelectItem>
                    <SelectItem value="scn-false">scn-false</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox defaultChecked />
                <Label>Checkbox</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch defaultChecked />
                <Label>Switch</Label>
              </div>
              <Slider defaultValue={[20]} max={30} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>{copy.componentsPage.feedback}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Progress value={62} />
              <div className="flex flex-wrap gap-2">
                <Tooltip>
                  <TooltipTrigger render={<Button variant="outline" />}>
                    Tooltip
                  </TooltipTrigger>
                  <TooltipContent>Evidence and counts use mono.</TooltipContent>
                </Tooltip>
                <Dialog>
                  <DialogTrigger render={<Button variant="secondary" />}>Dialog</DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Dialog title</DialogTitle>
                      <DialogDescription>One decision per dialog.</DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" />}>
                    Menu
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Action</DropdownMenuItem>
                    <DropdownMenuItem>Another action</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4">
          <h2 className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
            {copy.componentsPage.data}
          </h2>
          <div className="overflow-auto rounded-2xl border border-rule bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-field">
                  <TableHead className="border-r border-rule">#</TableHead>
                  <TableHead className="border-r border-rule">Name</TableHead>
                  <TableHead className="border-r border-rule">Cost</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  ["01", "alpha", "low", "1,488"],
                  ["02", "beta", "medium", "1,560"],
                  ["03", "gamma", "high", "2,400"],
                ].map(([id, name, cost, units]) => (
                  <TableRow key={id}>
                    <TableCell className="border-r border-rule font-mono">{id}</TableCell>
                    <TableCell className="border-r border-rule font-mono">{name}</TableCell>
                    <TableCell className="border-r border-rule">
                      <span className="rounded-full bg-field px-2 py-1 text-xs">{cost}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{units}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="font-mono text-xs tracking-[0.18em] uppercase text-muted-foreground">
            {copy.componentsPage.navigation}
          </h2>
          <Tabs defaultValue="line">
            <TabsList className="h-11 rounded-full">
              <TabsTrigger value="line" className="min-h-11 rounded-full px-4">
                Line
              </TabsTrigger>
              <TabsTrigger value="default" className="min-h-11 rounded-full px-4">
                Default
              </TabsTrigger>
            </TabsList>
            <TabsContent value="line" className="pt-4 text-sm text-muted-foreground">
              Navigation uses a pill on the active route and a flat hover elsewhere.
            </TabsContent>
            <TabsContent value="default" className="pt-4 text-sm text-muted-foreground">
              Tabs never replace primary navigation.
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
