import React from 'react'
import { render } from '@testing-library/react'

import { RealtimeProvider } from './context/RealtimeContext'

const AllTheProviders = ({ children }) => {
  return (
    <RealtimeProvider>
      {children}
    </RealtimeProvider>
  )
}

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render } 