import React from 'react'
import {
  Body,
  Button,
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
  meetingTitle?: string
  meetingDescription?: string
  meetingWhen?: string
  meetingLocation?: string
  meetingUrl?: string
  hostName?: string
  acceptUrl?: string
  declineUrl?: string
}

const Email = ({
  meetingTitle = 'הזמנה לפגישה',
  meetingDescription,
  meetingWhen,
  meetingLocation,
  meetingUrl,
  hostName,
  acceptUrl = '#',
  declineUrl = '#',
}: Props) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>{`הזמנה לפגישה: ${meetingTitle}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>AILON TASK · CRM</Text>
          <Heading style={h1}>הזמנה לפגישה</Heading>
          {hostName ? <Text style={sub}>מאת: {hostName}</Text> : null}
        </Section>

        <Section style={card}>
          <Heading as="h2" style={h2}>
            {meetingTitle}
          </Heading>
          {meetingDescription ? <Text style={desc}>{meetingDescription}</Text> : null}

          <Hr style={hr} />

          <InfoRow label="תאריך ושעה" value={meetingWhen} />
          <InfoRow label="מיקום" value={meetingLocation} />
          {meetingUrl ? (
            <Text style={row}>
              <span style={rowLabel}>קישור: </span>
              <a href={meetingUrl} style={link}>
                {meetingUrl}
              </a>
            </Text>
          ) : null}

          <Section style={{ textAlign: 'center' as const, marginTop: '20px' }}>
            <Button href={acceptUrl} style={acceptBtn}>
              ✓ אישור השתתפות
            </Button>
            <span style={{ display: 'inline-block', width: '10px' }} />
            <Button href={declineUrl} style={declineBtn}>
              ✗ לא אוכל להגיע
            </Button>
          </Section>
        </Section>

        <Text style={footer}>הודעה אוטומטית ממערכת Ailon Task</Text>
      </Container>
    </Body>
  </Html>
)

const InfoRow = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <Text style={row}>
      <span style={rowLabel}>{label}: </span>
      <span style={rowValue}>{value}</span>
    </Text>
  ) : null

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `הזמנה לפגישה — ${data.meetingTitle ?? ''}`.trim(),
  displayName: 'הזמנה לפגישה',
  previewData: {
    meetingTitle: 'סנכרון שבועי',
    meetingDescription: 'עדכוני פרויקטים ותכנון השבוע',
    meetingWhen: 'ראשון, 20/07/2026 10:00',
    meetingLocation: 'משרד ראשי',
    meetingUrl: 'https://zoom.us/j/1234567890',
    hostName: 'רועי',
    acceptUrl: 'https://example.com/meeting-invite?token=abc&action=accept',
    declineUrl: 'https://example.com/meeting-invite?token=abc&action=decline',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', direction: 'rtl' as const }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const header = { paddingBottom: '16px' }
const brand = { fontSize: '11px', letterSpacing: '0.3em', color: '#0f766e', margin: 0 }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '6px 0 0' }
const h2 = { fontSize: '18px', color: '#0f172a', margin: '0 0 8px' }
const sub = { fontSize: '13px', color: '#64748b', margin: '4px 0 0' }
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
const link = { color: '#0f766e', textDecoration: 'underline' }
const acceptBtn = {
  backgroundColor: '#0f766e',
  color: '#ffffff',
  padding: '10px 18px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}
const declineBtn = {
  backgroundColor: '#e2e8f0',
  color: '#0f172a',
  padding: '10px 18px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#94a3b8', marginTop: '16px', textAlign: 'center' as const }
