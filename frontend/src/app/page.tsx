import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Zap, Trophy, MessageSquare, Coins } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16 gradient-bg rounded-lg mb-12">
        <div className="max-w-4xl mx-auto text-white">
          <h1 className="text-5xl font-bold mb-6">
            Welcome to Masterminds
          </h1>
          <p className="text-xl mb-8 opacity-90">
            The expert Q&A platform where knowledge meets opportunity. 
            Ask questions, earn bounties, and get AI-powered answers when experts aren't available.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/ask">Ask a Question</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary" asChild>
              <Link href="/questions">Browse Questions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">How Masterminds Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Ask & Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Post detailed questions and get expert answers from our community of professionals.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <Coins className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Bounty System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Set bounties to incentivize high-quality answers and reward expertise.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>AI Fallback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get AI-generated answers when no expert responds within the SLA timeframe.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Questions Preview */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Recent Questions</h2>
          <Button variant="outline" asChild>
            <Link href="/questions">View All</Link>
          </Button>
        </div>
        
        <div className="space-y-4">
          {/* Mock questions for now */}
          <Card className="question-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    <Link href="/questions/1" className="hover:text-primary">
                      How to implement OAuth 2.0 with JWT tokens in a Node.js application?
                    </Link>
                  </CardTitle>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary">node.js</Badge>
                    <Badge variant="secondary">oauth</Badge>
                    <Badge variant="secondary">jwt</Badge>
                  </div>
                </div>
                <Badge className="bounty-badge">$50</Badge>
              </div>
              <CardDescription>
                I'm building a REST API and need to implement secure authentication using OAuth 2.0 with JWT tokens...
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="question-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    <Link href="/questions/2" className="hover:text-primary">
                      Best practices for React state management in large applications?
                    </Link>
                  </CardTitle>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary">react</Badge>
                    <Badge variant="secondary">state-management</Badge>
                    <Badge variant="secondary">redux</Badge>
                  </div>
                </div>
                <Badge className="bounty-badge">$75</Badge>
              </div>
              <CardDescription>
                Our React application is growing complex and we're having issues with state management...
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="question-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    <Link href="/questions/3" className="hover:text-primary">
                      Database design for a scalable e-commerce platform
                    </Link>
                  </CardTitle>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary">database</Badge>
                    <Badge variant="secondary">postgresql</Badge>
                    <Badge variant="secondary">scalability</Badge>
                  </div>
                </div>
                <Badge className="bounty-badge">$100</Badge>
              </div>
              <CardDescription>
                Need advice on designing a database schema that can handle millions of products and orders...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid md:grid-cols-4 gap-8 text-center">
        <div>
          <div className="text-3xl font-bold text-primary">1,234</div>
          <div className="text-muted-foreground">Questions Asked</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary">987</div>
          <div className="text-muted-foreground">Expert Answers</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary">156</div>
          <div className="text-muted-foreground">Active Experts</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary">$12,500</div>
          <div className="text-muted-foreground">Bounties Paid</div>
        </div>
      </section>
    </div>
  )
}