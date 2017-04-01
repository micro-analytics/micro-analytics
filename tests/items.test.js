const request = require('request-promise')
const expect = require('expect')
const { listen, mockDb } = require('./utils')

const service = require('../src')
let url

beforeEach(async () => {
  mockDb._reset()
  url = await listen(service)
})

describe('single', () => {
  it('should set the views of a non-existant path to one', async () => {
    const body = JSON.parse(await request(`${url}/nonexistant`))
    expect(body.views).toEqual(1)
  })

  it('should increment the views of an existant path', async () => {
    await request(`${url}/existant`)
    const body = JSON.parse(await request(`${url}/existant`))
    expect(body.views).toEqual(2)
  })

  it('should return 0 views on a non-existant path if inc is set to false', async () => {
    const body = JSON.parse(await request(`${url}/path?inc=false`))
    expect(body.views).toEqual(0)
  })

  it('should not increment the views of an existant path if inc is set to false', async () => {
    await request(`${url}/existant`)
    const body = JSON.parse(await request(`${url}/existant?inc=false`))
    expect(body.views).toEqual(1)
  })

  it('should not return anything for a POST request', async () => {
    const body = await request.post(`${url}/existant`)
    expect(body).toEqual('')
  })
})

describe('all', () => {
  it('should return an empty array if no previous views exist', async () => {
    const body = JSON.parse(await request(`${url}/?all=true`))
    expect(body.data).toEqual({})
    expect(body.time).toExist()
  })

  it('should return previous views of one route', async () => {
    await request(`${url}/route`)
    await request(`${url}/route`)
    const body = JSON.parse(await request(`${url}/?all=true`))
    expect(Object.keys(body.data).length).toBe(1)
    expect(body.data['/route'].views).toExist()
    expect(body.data['/route'].views.length).toBe(2)
  })

  it('should return previous views of all routes', async () => {
    await request(`${url}/route`)
    await request(`${url}/route`)
    await request(`${url}/route2`)
    await request(`${url}/route2`)
    await request(`${url}/route2`)
    const body = JSON.parse(await request(`${url}/?all=true`))
    expect(Object.keys(body.data).length).toBe(2)
    expect(body.data['/route'].views).toExist()
    expect(body.data['/route'].views.length).toBe(2)
    expect(body.data['/route2'].views).toExist()
    expect(body.data['/route2'].views.length).toBe(3)
  })

  describe('filtering', () => {
    it('should filter based on pathname', async () => {
      await request(`${url}/rover`)
      await request(`${url}/route`)
      const body = JSON.parse(await request(`${url}/rover?all=true`))
      expect(Object.keys(body.data).length).toBe(1)
      expect(body.data['/rover'].views).toExist()
      expect(body.data['/rover'].views.length).toBe(1)
    })

    it('should filter based on starting with pathname', async () => {
      await request(`${url}/rover`)
      await request(`${url}/rover2`)
      await request(`${url}/route`)
      const body = JSON.parse(await request(`${url}/rover?all=true`))
      expect(Object.keys(body.data).length).toBe(2)
      expect(body.data['/rover'].views).toExist()
      expect(body.data['/rover'].views.length).toBe(1)
      expect(body.data['/rover2'].views).toExist()
      expect(body.data['/rover2'].views.length).toBe(1)
    })

    it('should filter based on before after', async () => {
      const after = new Date('2017-01-01T09:11:00.000Z').getTime()
      const before = new Date('2017-01-01T09:41:00.000Z').getTime()

      mockDb._put('/rover', { views: [
        { time: new Date('2017-01-01T09:00:00.000Z').getTime() },
        { time: new Date('2017-01-01T09:10:00.000Z').getTime() },
        { time: new Date('2017-01-01T09:20:00.000Z').getTime() },
        { time: new Date('2017-01-01T09:30:00.000Z').getTime() },
        { time: new Date('2017-01-01T09:40:00.000Z').getTime() },
        { time: new Date('2017-01-01T09:50:00.000Z').getTime() },
      ]})

      const mapToIsoString = view => new Date(view.time).toISOString()
      const body = JSON.parse(await request(`${url}/rover?all=true&before=${before}&after=${after}`))
      expect(body.data['/rover'].views.map(mapToIsoString)).toEqual([
        '2017-01-01T09:20:00.000Z',
        '2017-01-01T09:30:00.000Z',
        '2017-01-01T09:40:00.000Z'
      ])
    })
  })
})
