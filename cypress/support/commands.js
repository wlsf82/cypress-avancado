import 'cypress-localstorage-commands'

Cypress.Commands.add('dismissFirstStory', () => {
  cy.get('.button-small')
    .first()
    .should('be.visible')
    .click()
})
