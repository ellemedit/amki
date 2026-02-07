import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page from '../app/page'

test('Page renders successfully', () => {
  render(<Page />)
  expect(screen.getByRole('main')).toBeDefined()
})
