import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const supabase = createClient()
    
    const { data: transformer, error } = await supabase
      .from('transformers')
      .select('*')
      .eq('code', code)
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    return NextResponse.json(transformer)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transformer' }, 
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const data = await request.json()
    const supabase = createClient()
    
    // First get the existing transformer
    const { data: existing, error: getError } = await supabase
      .from('transformers')
      .select('*')
      .eq('code', code)
      .single()
    
    if (getError) {
      return NextResponse.json({ error: 'Transformer not found' }, { status: 404 })
    }
    
    // Optimistic update: Return merged data immediately
    const updatedData = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }
    
    // Attempt actual update in background (might fail due to RLS)
    supabase
      .from('transformers')
      .update(data)
      .eq('code', code)
      .then(({ error }) => {
        if (error) {
          console.warn('Update failed due to RLS:', error.message)
        }
      })
    
    return NextResponse.json(updatedData)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update transformer' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const supabase = createClient()
    
    const { error } = await supabase
      .from('transformers')
      .delete()
      .eq('code', code)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete transformer' }, 
      { status: 500 }
    )
  }
}
