const applicationPrivateKey = process.env.REACT_APP_PRIVATE_API // will save this in the env var

// try run this
async function getEventsFromAPI() {
  const orgId = process.env.REACT_APP_ORG_ID // will save this in the env var
  const url = `https://www.eventbriteapi.com/v3/organizations/${orgId}/events/`

  const response = await fetch(url, {
    headers: {
      Authorization: 'Bearer ' + applicationPrivateKey
    }
  })

  if (response.ok) {
    return response.json()
  }

  throw Error('Something went wrong lol')
}

export async function getEvents() {
  const response = await getEventsFromAPI()

  return response.events
}
