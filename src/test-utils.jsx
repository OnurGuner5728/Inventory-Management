import React from 'react'
import { render } from '@testing-library/react'
import { DataProvider } from './context/DataContext'
import { RealtimeProvider } from './context/RealtimeContext'

const AllTheProviders = ({ children }) => {
  return (
    <DataProvider>
      <RealtimeProvider>
        {children}
      </RealtimeProvider>
    </DataProvider>
  )
}

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render } 