import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuthForm from './AuthForm'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from 'next-themes'
import { useNavigate } from 'react-router-dom'

// Mock dependencies
vi.mock('@/contexts/AuthContext')
vi.mock('next-themes')
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}))

describe('AuthForm', () => {
  const mockSignIn = vi.fn()
  const mockSignInWithGoogle = vi.fn()
  const mockNavigate = vi.fn()
  const mockSetTheme = vi.fn()

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      signInWithGoogle: mockSignInWithGoogle,
      user: null,
      session: null,
      isLoading: false,
      isAdmin: false,
      status: null,
      signUp: vi.fn(),
      signOut: vi.fn(),
    })

    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      themes: ['light', 'dark'],
    })

    vi.mocked(useNavigate).mockReturnValue(mockNavigate)

    // Reset mocks before each test
    vi.clearAllMocks()
  })

  it('renders the sign-in form and Google sign-up button', () => {
    render(<AuthForm />)

    expect(
      screen.getByRole('button', { name: /sign up with google/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /sign in with email/i }),
    ).toBeInTheDocument()
  })

  it('does not render the old sign-up tab', () => {
    render(<AuthForm />)

    expect(
      screen.queryByRole('tab', { name: /sign up/i }),
    ).not.toBeInTheDocument()
  })

  it('calls signInWithGoogle when the Google button is clicked', () => {
    render(<AuthForm />)

    const googleButton = screen.getByRole('button', {
      name: /sign up with google/i,
    })
    fireEvent.click(googleButton)

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('calls signIn when the email form is submitted with valid data', async () => {
    mockSignIn.mockResolvedValue({ error: undefined })
    render(<AuthForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const signInButton = screen.getByRole('button', {
      name: /sign in with email/i,
    })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('shows an error if email sign-in is attempted with invalid email', async () => {
    render(<AuthForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const form = screen.getByTestId('signin-form')

    fireEvent.change(emailInput, { target: { value: 'not-an-email' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.submit(form)

    expect(mockSignIn).not.toHaveBeenCalled()

    const errorContainer = await screen.findByTestId('auth-error')
    expect(errorContainer).toBeInTheDocument()
    expect(errorContainer).toHaveTextContent(
      /please enter a valid email address/i,
    )
  })
})
