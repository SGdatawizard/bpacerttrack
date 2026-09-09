import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TEAM, BASE_EXPERTISERS, today } from '../lib/constants'

const BLANK = {
  expertiser: '',
  sender_department: '',
  form_date: today(),
  item_description: '',
  cat_number: '',
  buying_form: '',
  stock_number: '',
  on_extension: false,
  auctioneer: '',
  sale_date: '',
  lot_number: '',
  client_name: '',
  pink_zone: false,
  paid_by: '',
  amount: '',
  handled_by: TEAM[0]
}

function toForm(item) {
  if (!item) return { ...BLANK }
  const out = { ...BLANK }
  for (const key of Object.keys(BLANK)) {
    out[key] = item[key] === null || item[key] === undefined ? BLANK[key] : item[key]
  }
  return out
}

export default function IFEForm({ editItem, expertisers, onSaved, onCancel }) {
  const known = Array.from(new Set([...BASE_EXPERTISERS, ...expertisers]))
  const initial = toForm(editItem)
  const startsOther = Boolean(initial.expertiser) && !known.includes(initial.expertiser)

  const [form, setForm] = useState(initial)
  const [otherMode, setOtherMode] = useState(startsOther)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  function onExpertiserChange(e) {
    const value = e.target.value
    if (value === '__other') {
      setOtherMode(true)
      setForm((f) => ({ ...f, expertiser: '' }))
    } else {
      setOtherMode(false)
      setForm((f) => ({ ...f, expertiser: value }))
    }
  }

  async function save() {
    const expertiser = form.expertiser.trim()
    if (!expertiser) {
      setError('Enter the expertiser this item is going to. Items are grouped for sending by this name.')
      return
    }
    if (!form.item_description.trim()) {
      setError('Enter an item description so the item can be identified on the sending list.')
      return
    }

    setBusy(true)
    setError('')

    const payload = {
      ...form,
      expertiser,
      sale_date: form.sale_date || null,
      form_date: form.form_date || null,
      amount: form.amount === '' ? null : Number(form.amount)
    }

    const query = editItem
      ? supabase.from('items').update(payload).eq('id', editItem.id)
      : supabase.from('items').insert(payload)

    const { error: saveError } = await query
    if (saveError) {
      setError(saveError.message)
      setBusy(false)
      return
    }

    // Remember any new expertiser name so it appears in the dropdown next time.
    await supabase.from('expertisers').upsert({ name: expertiser }, { onConflict: 'name' })

    setBusy(false)
    onSaved(editItem ? 'Item updated.' : 'Item added and ready for sending.')
  }

  return (
    <>
      <div className="page-head">
        <h1>{editItem ? 'Edit item' : 'Items for Expertising'}</h1>
        <p>
          One form per item. Once saved, the item waits under its expertiser on the Awaiting sending
          page until you create a sending list.
        </p>
      </div>

      {error && <div className="notice notice-bad">{error}</div>}

      <div className="panel">
        <fieldset>
          <legend>Where it is going</legend>
          <div className="grid">
            <div className="field">
              <label htmlFor="expertiser">B.P.A. / R.P.S. / Other</label>
              <select
                id="expertiser"
                value={otherMode ? '__other' : form.expertiser}
                onChange={onExpertiserChange}
              >
                <option value="">Select an expertiser…</option>
                {known.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="__other">Other — type a name</option>
              </select>
              {otherMode && (
                <input
                  type="text"
                  placeholder="Expertiser name"
                  value={form.expertiser}
                  onChange={set('expertiser')}
                  style={{ marginTop: 8 }}
                />
              )}
              <span className="hint">
                Type the name exactly as before so items group together on one list.
              </span>
            </div>

            <div className="field">
              <label htmlFor="sender">Sender &amp; department</label>
              <input id="sender" type="text" value={form.sender_department} onChange={set('sender_department')} />
            </div>

            <div className="field">
              <label htmlFor="form_date">Date</label>
              <input id="form_date" type="date" value={form.form_date} onChange={set('form_date')} />
            </div>

            <div className="field">
              <label htmlFor="handled_by">Handled by</label>
              <select id="handled_by" value={form.handled_by} onChange={set('handled_by')}>
                {TEAM.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>The item</legend>
          <div className="grid">
            <div className="field span-2">
              <label htmlFor="desc">Item description</label>
              <textarea id="desc" rows={3} value={form.item_description} onChange={set('item_description')} />
            </div>

            <div className="field">
              <label htmlFor="cat">S.G. or other catalogue number</label>
              <input id="cat" type="text" value={form.cat_number} onChange={set('cat_number')} />
            </div>

            <div className="field">
              <label htmlFor="stock">Stock number</label>
              <input id="stock" type="text" value={form.stock_number} onChange={set('stock_number')} />
            </div>

            <div className="field">
              <label htmlFor="buying">Buying form</label>
              <input id="buying" type="text" value={form.buying_form} onChange={set('buying_form')} />
            </div>

            <div className="field">
              <label htmlFor="client">Name of client if not SG property</label>
              <input id="client" type="text" value={form.client_name} onChange={set('client_name')} />
            </div>

            <div className="field">
              <span>On extension</span>
              <div className="choice">
                <label>
                  <input
                    type="radio"
                    name="extension"
                    checked={form.on_extension === true}
                    onChange={() => setForm((f) => ({ ...f, on_extension: true }))}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="extension"
                    checked={form.on_extension === false}
                    onChange={() => setForm((f) => ({ ...f, on_extension: false }))}
                  />
                  No
                </label>
              </div>
            </div>

            <div className="field">
              <span>Pink zone</span>
              <div className="choice">
                <label>
                  <input
                    type="radio"
                    name="pink"
                    checked={form.pink_zone === true}
                    onChange={() => setForm((f) => ({ ...f, pink_zone: true }))}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="pink"
                    checked={form.pink_zone === false}
                    onChange={() => setForm((f) => ({ ...f, pink_zone: false }))}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Auction details</legend>
          <div className="grid grid-3">
            <div className="field">
              <label htmlFor="auctioneer">Auctioneer</label>
              <input id="auctioneer" type="text" value={form.auctioneer} onChange={set('auctioneer')} />
            </div>
            <div className="field">
              <label htmlFor="sale_date">Sale date</label>
              <input id="sale_date" type="date" value={form.sale_date || ''} onChange={set('sale_date')} />
            </div>
            <div className="field">
              <label htmlFor="lot">Lot number</label>
              <input id="lot" type="text" value={form.lot_number} onChange={set('lot_number')} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Cost</legend>
          <div className="grid">
            <div className="field">
              <label htmlFor="paid_by">Who is paying</label>
              <input id="paid_by" type="text" value={form.paid_by} onChange={set('paid_by')} />
            </div>
            <div className="field">
              <label htmlFor="amount">How much</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount ?? ''}
                onChange={set('amount')}
              />
            </div>
          </div>
        </fieldset>

        <div className="actions">
          <button className="btn" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : editItem ? 'Save changes' : 'Add item'}
          </button>
          {onCancel && (
            <button className="btn btn-quiet" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </>
  )
}
