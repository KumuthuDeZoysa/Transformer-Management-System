import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-sans font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground font-serif">Configure system preferences and thresholds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Temperature Thresholds</CardTitle>
              <CardDescription className="font-serif">Set temperature limits for anomaly detection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warningTemp" className="font-serif">
                  Warning Temperature (°C)
                </Label>
                <Input id="warningTemp" type="number" defaultValue="85" className="font-serif" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="criticalTemp" className="font-serif">
                  Critical Temperature (°C)
                </Label>
                <Input id="criticalTemp" type="number" defaultValue="95" className="font-serif" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTemp" className="font-serif">
                  Maximum Safe Temperature (°C)
                </Label>
                <Input id="maxTemp" type="number" defaultValue="105" className="font-serif" />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">Notifications</CardTitle>
              <CardDescription className="font-serif">Configure alert and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-serif">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground font-serif">
                    Receive email notifications for critical alerts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-serif">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground font-serif">Get SMS alerts for emergency situations</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-serif">Daily Reports</Label>
                  <p className="text-sm text-muted-foreground font-serif">Receive daily inspection summary reports</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">AI Analysis</CardTitle>
              <CardDescription className="font-serif">Configure automated analysis parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sensitivity" className="font-serif">
                  Detection Sensitivity
                </Label>
                <Input id="sensitivity" type="range" min="1" max="10" defaultValue="7" className="font-serif" />
                <div className="flex justify-between text-xs text-muted-foreground font-serif">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-serif">Auto-Analysis</Label>
                  <p className="text-sm text-muted-foreground font-serif">Automatically analyze uploaded images</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="font-sans">System</CardTitle>
              <CardDescription className="font-serif">General system configuration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone" className="font-serif">
                  Timezone
                </Label>
                <Input id="timezone" defaultValue="Asia/Colombo" className="font-serif" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="font-serif">
                  Language
                </Label>
                <Input id="language" defaultValue="English" className="font-serif" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-serif">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground font-serif">Enable dark theme interface</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="font-serif">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
