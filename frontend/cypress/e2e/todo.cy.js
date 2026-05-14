describe('Managing todo items of a task (R8)', () => {
  let uid
  let email
  let taskid

  before(function () {
    cy.fixture('user.json')
      .then((user) => {
        email = user.email

        cy.request({
          method: 'GET',
          url: `http://localhost:5000/users/bymail/${user.email}`,
          failOnStatusCode: false
        }).then((res) => {
          if (res.status === 200 && res.body && res.body._id) {
            const existingUid = res.body._id.$oid

            cy.request({
              method: 'GET',
              url: `http://localhost:5000/tasks/ofuser/${existingUid}`,
              failOnStatusCode: false
            }).then((taskRes) => {
              if (taskRes.status === 200 && Array.isArray(taskRes.body)) {
                taskRes.body.forEach((task) => {
                  cy.request({
                    method: 'DELETE',
                    url: `http://localhost:5000/tasks/byid/${task._id.$oid}`,
                    failOnStatusCode: false
                  })
                })
              }
            })

            cy.request({
              method: 'DELETE',
              url: `http://localhost:5000/users/${existingUid}`,
              failOnStatusCode: false
            })
          }

          cy.request({
            method: 'POST',
            url: 'http://localhost:5000/users/create',
            form: true,
            body: user
          }).then((response) => {
            uid = response.body._id.$oid

            cy.request({
              method: 'POST',
              url: 'http://localhost:5000/tasks/create',
              form: true,
              body: {
                title: 'Test Task',
                description: 'A task for testing todo items',
                userid: uid,
                url: 'dQw4w9WgXcQ',
                todos: 'Watch video'
              }
            }).then((response) => {
              taskid = response.body[0]._id.$oid
            })
          })
        })
      })
  })

  beforeEach(function () {
    cy.visit('/')
    cy.contains('div', 'Email Address')
      .find('input[type=text]')
      .type(email)
    cy.get('form').submit()

    cy.contains('h1', 'Your tasks', { timeout: 10000 })

    cy.get('.container-element img').first().click({ force: true })

    cy.get('.popup', { timeout: 10000 }).should('be.visible')
    cy.get('.todo-list', { timeout: 10000 }).should('exist')
  })

  const addTodo = (text) => {
    cy.get('.popup-inner input[placeholder="Add a new todo item"]')
      .type(text, { force: true })
    cy.get('.popup-inner input[type=submit][value=Add]')
      .click({ force: true })
  }

  describe('R8UC1 – Creating a new todo item', () => {

    it('TC1: should add a new todo item with a valid description', () => {
      const todoText = 'Review lecture notes'

      addTodo(todoText)

      cy.get('.todo-list .todo-item', { timeout: 10000 })
        .should('contain.text', todoText)
    })

    it('TC2: should not allow adding a todo when the description is empty', () => {
      cy.get('.popup-inner input[placeholder="Add a new todo item"]')
        .should('have.value', '')

      cy.get('.todo-list .todo-item').then(($items) => {
        const countBefore = $items.length

        cy.get('.popup-inner .inline-form').last().submit()

        cy.wait(1000)

        cy.get('.todo-list .todo-item')
          .should('have.length.gte', countBefore)
      })
    })

    it('TC3: should clear the input field after adding a todo', () => {
      const todoText = 'Complete assignment draft'

      addTodo(todoText)

      cy.get('.popup-inner input[placeholder="Add a new todo item"]')
        .should('have.value', '')
    })

    it('TC4: should create a new todo item in unchecked (active) state', () => {
      const todoText = 'Prepare for exam'

      addTodo(todoText)

      cy.contains('.todo-item', todoText, { timeout: 10000 })
        .find('.checker')
        .should('have.class', 'unchecked')
    })
  })

  describe('R8UC2 – Toggling a todo item', () => {

    it('TC5: should toggle an active (unchecked) todo to done (checked)', () => {
      cy.get('.todo-list .todo-item .checker.unchecked')
        .first()
        .click({ force: true })

      cy.get('.todo-list .todo-item .checker.checked')
        .should('have.length.gte', 1)
    })

    it('TC6: should toggle a done (checked) todo back to active (unchecked)', () => {
      cy.get('.todo-list .todo-item .checker.unchecked')
        .first()
        .click({ force: true })

      cy.get('.todo-list .todo-item .checker.checked')
        .first()
        .should('exist')

      cy.get('.todo-list .todo-item .checker.checked')
        .first()
        .click({ force: true })

      cy.get('.todo-list .todo-item .checker.unchecked')
        .should('have.length.gte', 1)
    })

    it('TC7: should apply strikethrough styling when a todo is checked', () => {
      cy.get('.todo-list .todo-item .checker.unchecked')
        .first()
        .click({ force: true })

      cy.get('.todo-list .todo-item .checker.checked + .editable')
        .first()
        .should('have.css', 'text-decoration-line', 'line-through')
    })

    it('TC8: should remove strikethrough styling when a checked todo is unchecked', () => {
      const todoText = 'Strikethrough test item'
      addTodo(todoText)

      cy.contains('.todo-item', todoText, { timeout: 10000 })
        .should('exist')

      cy.contains('.todo-item', todoText)
        .find('.checker')
        .click({ force: true })

      cy.contains('.todo-item', todoText)
        .find('.checker')
        .should('have.class', 'checked')

      cy.contains('.todo-item', todoText)
        .find('.checker.checked')
        .click({ force: true })

      cy.contains('.todo-item', todoText)
        .find('.checker')
        .should('have.class', 'unchecked')

      cy.contains('.todo-item', todoText)
        .find('.editable')
        .should('not.have.css', 'text-decoration-line', 'line-through')
    })
  })

  describe('R8UC3 – Deleting a todo item', () => {

    it('TC9: should delete a todo item when the remover icon is clicked', () => {
      const todoText = 'Item to count and delete'
      addTodo(todoText)

      cy.contains('.todo-item', todoText, { timeout: 10000 })
        .should('exist')

      cy.get('.todo-list .todo-item').then(($items) => {
        const countBefore = $items.length

        cy.contains('.todo-item', todoText)
          .find('.remover')
          .click({ force: true })

        cy.wait(2000)

        cy.visit('/')
        cy.contains('div', 'Email Address')
          .find('input[type=text]')
          .type(email)
        cy.get('form').submit()
        cy.contains('h1', 'Your tasks', { timeout: 10000 })
        cy.get('.container-element img').first().click({ force: true })
        cy.get('.popup', { timeout: 10000 }).should('be.visible')
        cy.get('.todo-list', { timeout: 10000 }).should('exist')

        cy.contains('.todo-item', todoText)
          .should('not.exist')
      })
    })

    it('TC10: should remove the correct todo item from the list', () => {
      const uniqueTodo = 'Unique delete target'

      addTodo(uniqueTodo)

      cy.contains('.todo-item', uniqueTodo, { timeout: 10000 })
        .should('exist')

      cy.contains('.todo-item', uniqueTodo)
        .find('.remover')
        .click({ force: true })

      cy.wait(2000)

      cy.visit('/')
      cy.contains('div', 'Email Address')
        .find('input[type=text]')
        .type(email)
      cy.get('form').submit()
      cy.contains('h1', 'Your tasks', { timeout: 10000 })
      cy.get('.container-element img').first().click({ force: true })
      cy.get('.popup', { timeout: 10000 }).should('be.visible')
      cy.get('.todo-list', { timeout: 10000 }).should('exist')

      cy.contains('.todo-item', uniqueTodo)
        .should('not.exist')
    })

    it('TC11: should be able to delete a checked (done) todo item', () => {
      const todoText = 'Item to check then delete'

      addTodo(todoText)

      cy.contains('.todo-item', todoText, { timeout: 10000 })
        .should('exist')

      cy.contains('.todo-item', todoText)
        .find('.checker')
        .click({ force: true })

      cy.contains('.todo-item', todoText)
        .find('.checker')
        .should('have.class', 'checked')

      cy.contains('.todo-item', todoText)
        .find('.remover')
        .click({ force: true })

      cy.wait(1000)

      cy.contains('.todo-item', todoText, { timeout: 10000 })
        .should('not.exist')
    })
  })

  after(function () {
    cy.request({
      method: 'DELETE',
      url: `http://localhost:5000/tasks/byid/${taskid}`,
      failOnStatusCode: false
    })

    cy.request({
      method: 'DELETE',
      url: `http://localhost:5000/users/${uid}`,
      failOnStatusCode: false
    }).then((response) => {
      cy.log(response.body)
    })
  })
})
