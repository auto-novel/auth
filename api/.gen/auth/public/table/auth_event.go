//
// Code generated by go-jet DO NOT EDIT.
//
// WARNING: Changes to this file may cause incorrect behavior
// and will be lost if the code is regenerated
//

package table

import (
	"github.com/go-jet/jet/v2/postgres"
)

var AuthEvent = newAuthEventTable("public", "auth_event", "")

type authEventTable struct {
	postgres.Table

	// Columns
	ID        postgres.ColumnInteger
	Action    postgres.ColumnString
	Detail    postgres.ColumnString
	CreatedAt postgres.ColumnTimestampz

	AllColumns     postgres.ColumnList
	MutableColumns postgres.ColumnList
	DefaultColumns postgres.ColumnList
}

type AuthEventTable struct {
	authEventTable

	EXCLUDED authEventTable
}

// AS creates new AuthEventTable with assigned alias
func (a AuthEventTable) AS(alias string) *AuthEventTable {
	return newAuthEventTable(a.SchemaName(), a.TableName(), alias)
}

// Schema creates new AuthEventTable with assigned schema name
func (a AuthEventTable) FromSchema(schemaName string) *AuthEventTable {
	return newAuthEventTable(schemaName, a.TableName(), a.Alias())
}

// WithPrefix creates new AuthEventTable with assigned table prefix
func (a AuthEventTable) WithPrefix(prefix string) *AuthEventTable {
	return newAuthEventTable(a.SchemaName(), prefix+a.TableName(), a.TableName())
}

// WithSuffix creates new AuthEventTable with assigned table suffix
func (a AuthEventTable) WithSuffix(suffix string) *AuthEventTable {
	return newAuthEventTable(a.SchemaName(), a.TableName()+suffix, a.TableName())
}

func newAuthEventTable(schemaName, tableName, alias string) *AuthEventTable {
	return &AuthEventTable{
		authEventTable: newAuthEventTableImpl(schemaName, tableName, alias),
		EXCLUDED:       newAuthEventTableImpl("", "excluded", ""),
	}
}

func newAuthEventTableImpl(schemaName, tableName, alias string) authEventTable {
	var (
		IDColumn        = postgres.IntegerColumn("id")
		ActionColumn    = postgres.StringColumn("action")
		DetailColumn    = postgres.StringColumn("detail")
		CreatedAtColumn = postgres.TimestampzColumn("created_at")
		allColumns      = postgres.ColumnList{IDColumn, ActionColumn, DetailColumn, CreatedAtColumn}
		mutableColumns  = postgres.ColumnList{ActionColumn, DetailColumn, CreatedAtColumn}
		defaultColumns  = postgres.ColumnList{DetailColumn, CreatedAtColumn}
	)

	return authEventTable{
		Table: postgres.NewTable(schemaName, tableName, alias, allColumns...),

		//Columns
		ID:        IDColumn,
		Action:    ActionColumn,
		Detail:    DetailColumn,
		CreatedAt: CreatedAtColumn,

		AllColumns:     allColumns,
		MutableColumns: mutableColumns,
		DefaultColumns: defaultColumns,
	}
}
