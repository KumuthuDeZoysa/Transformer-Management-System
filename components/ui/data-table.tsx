import type React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T
  header: string
  render?: (value: any, item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  description?: string
  actions?: React.ReactNode
  className?: string
  emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  description,
  actions,
  className,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  return (
    <Card className={cn("card-hover", className)}>
      {(title || description || actions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            {title && <CardTitle className="font-sans">{title}</CardTitle>}
            {description && <CardDescription className="font-serif">{description}</CardDescription>}
          </div>
          {actions && <div className="button-group">{actions}</div>}
        </CardHeader>
      )}
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table className="table-modern">
            <TableHeader>
              <TableRow>
                {columns.map((column, columnIndex) => (
                  <TableHead key={`header-${columnIndex}-${String(column.key)}`} className={cn("font-serif", column.className)}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    <p className="text-muted-foreground font-serif">{emptyMessage}</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={index}>
                    {columns.map((column, columnIndex) => (
                      <TableCell key={`cell-${index}-${columnIndex}-${String(column.key)}`} className={cn("font-serif", column.className)}>
                        {column.render ? column.render(item[column.key], item) : String(item[column.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
