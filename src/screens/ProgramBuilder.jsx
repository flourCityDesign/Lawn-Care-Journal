import { Page, PageHeader, Card, CardBody } from '../components/ui'

export default function ProgramBuilder() {
  return (
    <Page>
      <PageHeader title="Program Builder" backTo="/plan" />
      <Card>
        <CardBody>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Coming soon</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: 1.5 }}>
            Draft a season's worth of tasks here without committing to a year, then commit them - individually or all
            at once - to one or more yards' Seasonal Plans whenever you're ready.
          </div>
        </CardBody>
      </Card>
    </Page>
  )
}
