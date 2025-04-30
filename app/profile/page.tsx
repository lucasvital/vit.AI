import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>

      <div className="flex flex-col gap-6 md:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                Change Avatar
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="john.doe@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" defaultValue="Support Manager" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>

        <div className="flex flex-col gap-6 md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="password">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="password">Password</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                </TabsList>
                <TabsContent value="password" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button className="w-full">Update Password</Button>
                </TabsContent>
                <TabsContent value="sessions" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-muted-foreground">Chrome on Windows</p>
                      </div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Mobile App</p>
                        <p className="text-sm text-muted-foreground">iPhone 13</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Logout
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Your activity metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Total Chats</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Avg. Response Time</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Satisfaction Rate</span>
                <span className="font-medium">-</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
