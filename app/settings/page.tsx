"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { fetchTransformersFromDb } from "@/lib/db-api"
import { seedTransformers } from "@/lib/seed-transformers"

export default function SettingsPage() {
  const [transformers, setTransformers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    fetchTransformersFromDb().then(setTransformers)
  }, [seeded])

  async function handleSeed() {
    setLoading(true)
    try {
      await seedTransformers()
      setSeeded(s => !s)
    } catch (e) {
      alert("Seeding failed: " + (e as any)?.message)
    }
    setLoading(false)
  }

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
          {/* Database Schema & Seed Data for Transformer */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-sans">Transformer Database Schema & Seed Data</CardTitle>
              <CardDescription className="font-serif">Use this schema and sample data to initialize your database for testing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <Label className="font-serif mb-1 block">Current Transformers in Database</Label>
                <Button size="sm" onClick={handleSeed} disabled={loading}>
                  {loading ? "Seeding..." : "Seed Data"}
                </Button>
              </div>
              <div className="mb-4 max-h-48 overflow-auto border rounded bg-muted p-2">
                {transformers.length === 0 ? (
                  <div className="text-xs text-muted-foreground font-mono">No transformers found.</div>
                ) : (
                  <table className="text-xs font-mono w-full">
                    <thead>
                      <tr>
                        <th className="text-left">Code</th>
                        <th className="text-left">Pole No</th>
                        <th className="text-left">Region</th>
                        <th className="text-left">Type</th>
                        <th className="text-left">Capacity</th>
                        <th className="text-left">Location</th>
                        <th className="text-left">Status</th>
                        <th className="text-left">Last Inspection</th>
                        <th className="text-left">Created</th>
                        <th className="text-left">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transformers.map(t => (
                        <tr key={t.id}>
                          <td>{t.code}</td>
                          <td>{t.pole_no}</td>
                          <td>{t.region}</td>
                          <td>{t.type}</td>
                          <td>{t.capacity}</td>
                          <td>{t.location}</td>
                          <td>{t.status}</td>
                          <td>{t.last_inspection}</td>
                          <td>{t.created_at}</td>
                          <td>{t.updated_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="mb-4">
                <Label className="font-serif mb-1 block">PostgreSQL Table Schema</Label>
                <pre className="bg-muted rounded p-3 text-xs overflow-x-auto font-mono">
{`CREATE TABLE transformers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  pole_no text,
  region text,
  type text,
  capacity text,
  location text,
  status text check (status in ('normal','warning','critical')) default 'normal',
  last_inspection timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);`}
                </pre>
              </div>
            </CardContent>
          </Card>
          {/* Database seeding section removed */}
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
