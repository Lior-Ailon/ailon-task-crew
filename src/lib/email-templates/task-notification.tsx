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

interface Props {
  eventLabel?: string
  taskTitle?: string
  taskDescription?: string
  status?: string
  priority?: string
  dueDate?: string
  assignee?: string
  actor?: string
}

const statusHe: Record<string, string> = {
  todo: 'לביצוע',
  in_progress: 'בתהליך',
  done: 'הושלם',
}

const priorityHe: Record<string, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  urgent: 'דחופה',
}

const Email = ({
  eventLabel = 'עדכון משימה',
  taskTitle = '—',
  taskDescription,
  status,
  priority,
  dueDate,
  assignee,
  actor,
}: Props) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>{`${eventLabel}: ${taskTitle}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>AILON TASK · CRM</Text>
          <Heading style={h1}>{eventLabel}</Heading>
        </Section>

        <Section style={card}>
          <Heading as="h2" style={h2}>
            {taskTitle}
          </Heading>
          {taskDescription ? <Text style={desc}>{taskDescription}</Text> : null}

          <Hr style={hr} />

          <Row label="סטטוס" value={status ? statusHe[status] ?? status : undefined} />
          <Row label="עדיפות" value={priority ? priorityHe[priority] ?? priority : undefined} />
          <Row label="תאריך יעד" value={dueDate} />
          <Row label="אחראי" value={assignee} />
          <Row label="בוצע על ידי" value={actor} />
        </Section>

        <Text style={footer}>הודעה אוטומטית ממערכת Ailon Task</Text>
      </Container>
    </Body>
  </Html>
)

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <Text style={row}>
      <span style={rowLabel}>{label}: </span>
      <span style={rowValue}>{value}</span>
    </Text>
  ) : null

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `[Ailon Task] ${data.eventLabel ?? 'עדכון משימה'} — ${data.taskTitle ?? ''}`.trim(),
  displayName: 'התראת משימה לצוות',
  to: 'Ailon-Team@ailon-task.com',
  previewData: {
    eventLabel: 'משימה נפתחה',
    taskTitle: 'לדוגמה: בדיקת מערכת',
    taskDescription: 'תיאור לדוגמה של המשימה',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-07-20',
    assignee: 'רועי',
    actor: 'רועי',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', direction: 'rtl' as const }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const header = { paddingBottom: '16px' }
const brand = { fontSize: '11px', letterSpacing: '0.3em', color: '#0f766e', margin: 0 }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '6px 0 0' }
const h2 = { fontSize: '18px', color: '#0f172a', margin: '0 0 8px' }
const card = {
  padding: '20px',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  background: '#f8fafc',
}
const desc = { fontSize: '14px', color: '#475569', margin: '0 0 8px' }
const hr = { borderColor: '#e2e8f0', margin: '12px 0' }
const row = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const rowLabel = { color: '#64748b' }
const rowValue = { fontWeight: 600 }
const footer = { fontSize: '12px', color: '#94a3b8', marginTop: '16px', textAlign: 'center' as const }
