describe('Hacker Stories', () => {
  context('Hitting the real API', () => {
    beforeEach(() => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: 'React',
          page: '0'
        }
      }).as('getStories')

      cy.visit('/')
      cy.wait('@getStories')
    })

    it('shows the first twenty stories', () => {
      cy.get('.item').should('have.length', 20)
    })

    it('shows the next twenty stories after clicking "More"', () => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: 'React',
          page: '1'
        }
      }).as('getNextStories')

      cy.contains('More')
        .should('be.visible')
        .click()

      cy.wait('@getNextStories')

      cy.get('.item').should('have.length', 40)
    })

    context('Search', () => {
      const initialTerm = 'React'
      const newTerm = 'Cypress'

      beforeEach(() => {
        cy.getLocalStorage('search')
          .should('be.equal', initialTerm)

        cy.intercept({
          method: 'GET',
          pathname: '**/search',
          query: {
            query: newTerm,
            page: '0'
          }
        }).as('getNewStories')
      })

      it('uses different search functionalities', () => {
        cy.getLocalStorage('search')
          .should('be.equal', initialTerm)

        cy.get('#search')
          .should('be.visible')
          .clear()
          .type(`${newTerm}{enter}`)
        cy.wait('@getNewStories')

        cy.getLocalStorage('search')
          .should('be.equal', newTerm)

        cy.get('.item').should('have.length', 20)
        cy.get('.item')
          .first()
          .should('contain', newTerm)
        cy.get(`button:contains(${initialTerm})`)
          .should('be.visible')
          .click()
        cy.wait('@getStories')

        cy.get('.item').should('have.length', 20)
        cy.get('.item')
          .first()
          .should('contain', initialTerm)
        cy.get(`button:contains(${newTerm})`)
          .should('be.visible')
      })

      it('uses the submit button to submit the form', () => {
        cy.get('#search')
          .should('be.visible')
          .clear()
          .type(newTerm)
        cy.contains('Submit')
          .should('be.visible')
          .click()
        cy.wait('@getNewStories')

        cy.getLocalStorage('search')
          .should('be.equal', newTerm)

        cy.get('.item').should('have.length', 20)
        cy.get('.item')
          .first()
          .should('contain', newTerm)
        cy.get(`button:contains(${initialTerm})`)
          .should('be.visible')
      })
    })
  })

  context('Mocking the API', () => {
    context('Last searches', () => {
      beforeEach(() => {
        const faker = require('faker')

        cy.intercept(
          'GET',
          '**/search**',
          {
            fixture: 'stories'
          }
        ).as('getRandomStories')

        cy.visit('/')

        Cypress._.times(6, () => {
          cy.get('#search')
            .should('be.visible')
            .clear()
            .type(`${faker.random.word()}{enter}`)
          cy.wait('@getRandomStories')
        })
      })

      it('shows a max of 5 buttons for the last searched terms', () => {
        cy.get('.last-searches')
          .within(() => {
            cy.get('button')
              .should('have.length', 5)
          })
      })
    })

    context('Other features', () => {
      const stories = require('../fixtures/stories')

      beforeEach(() => {
        cy.intercept(
          'GET',
          '**/search?query=React&page=0',
          { fixture: 'stories' }
        ).as('getStories')

        cy.visit('/')
        cy.wait('@getStories')
      })

      it('shows the first two stories in the list', () => {
        cy.get('.item').should('have.length', 2)

        cy.get('.item')
          .first()
          .should('contain', stories.hits[0].title)
          .and('contain', stories.hits[0].author)
          .and('contain', stories.hits[0].num_comments)
          .and('contain', stories.hits[0].points)
        cy.get(`.item a:contains(${stories.hits[0].title})`)
          .should('have.attr', 'href', stories.hits[0].url)

        cy.get('.item')
          .last()
          .should('contain', stories.hits[1].title)
          .and('contain', stories.hits[1].author)
          .and('contain', stories.hits[1].num_comments)
          .and('contain', stories.hits[1].points)
        cy.get(`.item a:contains(${stories.hits[1].title})`)
          .should('have.attr', 'href', stories.hits[1].url)
      })

      context('Dismiss', () => {
        it('shows only one story after dimissing the first story', () => {
          cy.dismissFirstStory()

          cy.get('.item').should('have.length', 1)
        })

        it('shows no story after dismissing all stories', () => {
          Cypress._.times(2, () => {
            cy.dismissFirstStory()
          })

          cy.get('.item').should('not.exist')
        })
      })

      context('Order by', () => {
        it('orders by title', () => {
          Cypress._.times(2, () => {
            cy.contains('Title')
              .should('be.visible')
              .click()
          })

          cy.get('.item')
            .first()
            .should('contain', stories.hits[1].title)

          cy.get('.item')
            .last()
            .should('contain', stories.hits[0].title)
        })

        it('orders by author', () => {
          Cypress._.times(2, () => {
            cy.contains('Author')
              .should('be.visible')
              .click()
          })

          cy.get('.item')
            .first()
            .should('contain', stories.hits[1].author)

          cy.get('.item')
            .last()
            .should('contain', stories.hits[0].author)
        })

        it('orders by comments', () => {
          cy.contains('Comments')
            .should('be.visible')
            .click()

          cy.get('.item')
            .first()
            .should('contain', stories.hits[1].num_comments)

          cy.get('.item')
            .last()
            .should('contain', stories.hits[0].num_comments)
        })

        it('orders by points', () => {
          Cypress._.times(2, () => {
            cy.contains('Points')
              .should('be.visible')
              .click()
          })

          cy.get('.item')
            .first()
            .should('contain', stories.hits[1].points)

          cy.get('.item')
            .last()
            .should('contain', stories.hits[0].points)
        })
      })
    })
  })

  context('Errors', () => {
    it('shows "Something went wrong ..." on a server error', () => {
      cy.intercept(
        'GET',
        '**/search?query=React&page=0',
        { statusCode: 500 }
      ).as('getServerFailure')

      cy.visit('/')
      cy.wait('@getServerFailure')

      cy.get('p:contains(Something went wrong ...)')
        .should('be.visible')
    })

    it('shows "Something went wrong ..." on a network error', () => {
      cy.intercept(
        'GET',
        '**/search?query=React&page=0',
        { forceNetworkError: true }
      ).as('getNetworkFailure')

      cy.visit('/')
      cy.wait('@getNetworkFailure')

      cy.get('p:contains(Something went wrong ...)')
        .should('be.visible')
    })
  })

  context('Delay simulation', () => {
    beforeEach(() => {
      cy.intercept(
        'GET',
        '**/search?query=React&page=0',
        {
          delay: 1000,
          fixture: 'stories'
        }
      ).as('getDelayedStories')

      cy.visit('/')
    })

    it('shows a loading state before showing the results', () => {
      cy.get('p:contains(Loading)')
        .should('be.visible')

      cy.wait('@getDelayedStories')
    })
  })

  context('Footer component', () => {
    it('is visible', () => {
      cy.get('footer')
        .should('be.visible')
        .screenshot('footer-component')
    })
  })
})
