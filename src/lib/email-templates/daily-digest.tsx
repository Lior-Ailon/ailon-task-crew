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

interface DigestItem {
  action: string
  title: string
  actor?: string
  time?: string
}

interface DigestGroup {
  entityLabel: string
  items: DigestItem[]
}

interface Props {
  dateLabel?: string
  total?: number
  groups?: DigestGroup[]
}

const Email = ({ dateLabel = '', total = 0, groups = [] }: Props) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>{`סיכום יומי — ${total} עדכונים`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>AILON TASK · CRM</Text>
          <Heading style={h1}>סיכום יומי</Heading>
          <Text style={sub}>{`${dateLabel} · ${total} עדכונים`}</Text>
        </Section>

        {groups.length === 0 ? (
          <Section style={card}>
            <Text style={row}>לא בוצעו שינויים ביממה האחרונה.</Text>
          </Section>
        ) : (
          groups.map((g, gi) => (
            <Section key={gi} style={card}>
              <Heading as="h2" style={h2}>{`${g.entityLabel} (${g.items.length})`}</Heading>
              <Hr style={hr} />
              {g.items.map((it, i) => (
                <Text key={i} style={row}>
                  <span style={rowValue}>{it.title}</span>
                  <span style={rowLabel}>{` — ${it.action}`}</span>
                  {it.actor ? <span style={rowLabel}>{` · ${it.actor}`}</span> : null}
                  {it.time ? <span style={rowLabel}>{` · ${it.time}`}</span> : null}
                </Text>
              ))}
            </Section>
          ))
        )}

        <Text style={footer}>הודעה אוטומטית ממערכת Ailon Task</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `[Ailon Task] סיכום יומי — ${data.total ?? 0} עדכונים`,
  displayName: 'סיכום יומי לצוות',
  to: 'Ailon-Team@ailon-task.com',
  previewData: {
    dateLabel: '01/08/2026',
    total: 3,
    groups: [
      {
        entityLabel: 'ליד',
        items: [
          { action: 'שינוי סטטוס', title: 'ישראל ישראלי', actor: 'רועי', time: '09:12' },
        ],
      },
      {
        entityLabel: 'משימה',
        items: [
          { action: 'נוצר', title: 'הכנת הצעת מחיר', time: '11:40' },
          { action: 'עודכן', title: 'פולו-אפ ללקוח', time: '15:02' },
        ],
      },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', direction: 'rtl' as const }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const header = { paddingBottom: '16px' }
const brand = { fontSize: '11px', letterSpacing: '0.3em', color: '#0f766e', margin: 0 }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '6px 0 0' }
const sub = { fontSize: '13px', color: '#64748b', margin: '4px 0 0' }
const h2 = { fontSize: '16px', color: '#0f172a', margin: '0 0 8px' }
const card = {
  padding: '16px 20px',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  background: '#f8fafc',
  marginBottom: '12px',
}
const hr = { borderColor: '#e2e8f0', margin: '10px 0' }
const row = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const rowLabel = { color: '#64748b' }
const rowValue = { fontWeight: 600 }
const footer = { fontSize: '12px', color: '#94a3b8', marginTop: '16px', textAlign: 'center' as const }
