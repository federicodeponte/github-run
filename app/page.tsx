import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Github, Zap, Code2, Rocket } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-6 w-6" />
            <span className="font-bold text-xl">GitHub Run</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
              Docs
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Button variant="ghost" size="sm">Sign In</Button>
            <Button size="sm">Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="h-4 w-4" />
            Python-first serverless platform
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Turn any Python function <br />
            <span className="text-primary">into an instant API</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deploy functions from your GitHub repo as API endpoints in seconds.
            No config, no servers, no hassle. Just push and go.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <Github className="h-5 w-5" />
              Connect GitHub
            </Button>
            <Button size="lg" variant="outline">
              View Demo
            </Button>
          </div>

          {/* Code Example */}
          <Card className="max-w-2xl mx-auto mt-12 text-left">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">functions/hello.py</span>
                  <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">Live</span>
                </div>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm">{`def hello(name: str = "World"):
    """A simple greeting function"""
    return {
        "message": f"Hello, {name}!",
        "timestamp": "2025-01-15T10:30:00Z"
    }`}</code>
                </pre>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Endpoint:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    https://api.githubrun.dev/you/repo/hello
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Zero Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Push Python functions to GitHub. We handle everything else - deployment, scaling, and monitoring.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Instant Deployment</h3>
              <p className="text-sm text-muted-foreground">
                Every push to main triggers automatic deployment. See real-time logs and get your endpoint URL instantly.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Production Ready</h3>
              <p className="text-sm text-muted-foreground">
                Sandboxed execution, rate limiting, API keys, and usage analytics. Built for scale from day one.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <p>© 2025 GitHub Run. Built with Next.js & Supabase.</p>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-foreground">Docs</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="https://github.com/federicodeponte/github-run" className="hover:text-foreground">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
