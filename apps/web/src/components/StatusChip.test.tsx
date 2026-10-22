import { render, screen } from '@testing-library/react'
import { StatusChip } from './StatusChip'

test('renders the status label', () => {
  render(<StatusChip status="rejected" />)
  expect(screen.getByText('rejected')).toBeInTheDocument()
})
