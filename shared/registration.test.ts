import { describe, expect, it } from 'vitest'
import { fieldErrors, registrationSchema, toPayload } from './registration.js'

const valid = {
  full_name: '  Tolulope Adeyemi ', gender: 'Female', institution: 'University of Ilorin', institution_other: '',
  department: 'Law', phone: '+234 801 234 5678', email: 'Tolu@Example.com ', needs_transport: 'No',
  area: '', address: '', consent: true, age_confirmed: true, followup_optin: false, source: 'qr-hostel',
}

const errorsFor = (input: object) => {
  const r = registrationSchema.safeParse(input)
  return r.success ? {} : fieldErrors(r.error)
}

describe('registrationSchema', () => {
  it('accepts a valid registration and normalises it for storage', () => {
    const r = registrationSchema.parse(valid)
    expect(toPayload(r)).toEqual({
      full_name: 'Tolulope Adeyemi', gender: 'Female', institution: 'University of Ilorin', institution_other: '',
      department: 'Law', phone: '08012345678', email: 'tolu@example.com', needs_transport: false, area: '',
      address: '', followup_optin: false, age_confirmed: true, source: 'qr-hostel',
    })
  })

  it('gives plain messages for each bad field', () => {
    expect(errorsFor({ ...valid, full_name: 'T', phone: '0801', email: 'tolu@', gender: '' })).toEqual({
      full_name: 'Enter your full name',
      phone: 'Enter an 11-digit number, e.g. 08012345678',
      email: 'Enter a valid email, e.g. name@gmail.com',
      gender: 'Choose one',
    })
  })

  it('requires consent and the age confirmation', () => {
    expect(errorsFor({ ...valid, consent: false, age_confirmed: false })).toEqual({
      consent: 'You need to agree to register',
      age_confirmed: 'Please confirm this to register',
    })
  })

  it('rejects institutions that are not offered', () => {
    expect(errorsFor({ ...valid, institution: 'Hogwarts' })).toEqual({ institution: 'Choose your institution' })
  })

  it('requires the institution name only when Other is chosen', () => {
    expect(errorsFor({ ...valid, institution: 'Other' })).toEqual({ institution_other: 'Enter the name of your institution' })
    const r = registrationSchema.parse({ ...valid, institution: 'Other', institution_other: 'Kwara Poly' })
    expect(toPayload(r).institution_other).toBe('Kwara Poly')
    // A stale "Other" value is dropped when a listed institution is chosen
    expect(toPayload(registrationSchema.parse({ ...valid, institution_other: 'Leftover' })).institution_other).toBe('')
  })

  it('requires area and address only when a bus is needed', () => {
    expect(errorsFor({ ...valid, needs_transport: 'Yes' })).toEqual({
      area: 'Tell us your area, e.g. Tanke',
      address: 'Add your address so we can plan the bus',
    })
    const r = registrationSchema.parse({ ...valid, needs_transport: 'Yes', area: 'Tanke', address: 'Block C, Oke-Odo' })
    expect(toPayload(r)).toMatchObject({ needs_transport: true, area: 'Tanke', address: 'Block C, Oke-Odo' })
    // Area/address typed before switching to "No" are not stored
    expect(toPayload(registrationSchema.parse({ ...valid, area: 'Tanke', address: 'Block C' }))).toMatchObject({ area: '', address: '' })
  })

  it('reports transport and institution errors together with other field errors', () => {
    const errors = errorsFor({ ...valid, full_name: '', needs_transport: 'Yes', institution: 'Other' })
    expect(Object.keys(errors).sort()).toEqual(['address', 'area', 'full_name', 'institution_other'])
  })

  it('caps long input', () => {
    expect(errorsFor({ ...valid, full_name: 'x'.repeat(81) })).toEqual({ full_name: 'Keep it under 80 characters' })
  })
})
