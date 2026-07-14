import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface FieldRow {
  label: string
  value: string
}

interface Props {
  entityLabel?: string
  action?: string
  title?: string
  actor?: string
  fields?: FieldRow[]
}

const Email = ({
  entityLabel = 'רשומה',
  action = 'עדכון',
  title = '—',
  actor,
  fields = [],
}: Props) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>{`${entityLabel} — ${action}: ${title}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>AILON TASK · CRM</Text>
          <Heading style={h1}>{`${entityLabel} — ${action}`}</Heading>
        </Section>

        <Section style={card}>
          <Heading as="h2" style={h2}>{title}</Heading>
          <Hr style={hr} />
          {fields.map((f, i) => (
            <Text key={i} style={row}>
              <span style={rowLabel}>{f.label}: </span>
              <span style={rowValue}>{f.value}</span>
            </Text>
          ))}
          {actor ? (
            <Text style={row}>
              <span style={rowLabel}>בוצע על ידי: </span>
              <span style={rowValue}>{actor}</span>
            </Text>
          ) : null}
        </Section>

        <Text style={footer}>הודעה אוטומטית ממערכת Ailon Task</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `[Ailon Task] ${data.entityLabel ?? 'עדכון'} — ${data.action ?? ''} — ${data.title ?? ''}`.trim(),
  displayName: 'עדכון כללי לצוות',
  to: 'Ailon-Team@ailon-task.com',
  previewData: {
    entityLabel: 'ליד',
    action: 'נוצר',
    title: 'ישראל ישראלי',
    actor: 'רועי',
    fields: [
      { label: 'חברה', value: 'ACME' },
      { label: 'סטטוס', value: 'חדש' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', direction: 'rtl' as const }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const header = { paddingBottom: '16px' }
const brand = { fontSize: '11px', letterSpacing: '0.3em', color: '#0f766e', margin: 0 }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '6px 0 0' }
const h2 = { fontSize: '18px', color: '#0f172a', margin: '0 0 8px' }
const card = { padding: '20px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#f8fafc' }
const hr = { borderColor: '#e2e8f0', margin: '12px 0' }
const row = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const rowLabel = { color: '#64748b' }
const rowValue = { fontWeight: 600 }
const footer = { fontSize: '12px', color: '#94a3b8', marginTop: '16px', textAlign: 'center' as const }
