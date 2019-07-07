class POable extends Statable {
  constructor (prop) {
    prop.nopo = prop.nopo || []
    super(prop)
  }

  set (prop) {
    // if (prop.nopo) this.nopo = prop.nopo
    // if (prop.poprefix) this.poprefix = prop.poprefix
    // if (prop.textIdx) this.textIdx = prop.textIdx
    let p = consume(prop, ['poid', 'povars'])
    super.set(prop)
    if (!this.name && this.nopo.includes('name')) this.name = prop.id
    if (p.poid) this.setPo(p.poid, p.povars)
  }

  setPo (name, vars) {
    this.poid = this.poprefix + name
    this.povars = vars
    if (!this.nopo.includes('name')) this.name = _(this.poid, vars, )
    if (!this.nopo.includes('text')) this.text = _(this.poid + POSUFFIX_DESC, vars)
    return this
  }

  checkTextIdx (textidx = '') {
    return dialog.hasOwnProperty(this.poid + POSUFFIX_DESC + textidx)
  }

  set textIdx (textidx) {
    let poid = this.poid + POSUFFIX_DESC
    this.text = _(poid + textidx, this.povars, poid)
  }

  set poDelta (delta) {
    if (typeof delta === 'string') {
      this.poid += delta
    } else {
      this.povars = delta
    }
    this.name = _(this.poid, this.povars)
    this.text = _(this.poid + POSUFFIX_DESC, this.povars)
  }
}
