/**
  * Copyright Whitebox Software Ltd. 2014
  * All Rights Reserved.

  * Created by chris on 22/01/2016.

  */
package io.venuu.vuu.client.swing.gui

import com.typesafe.scalalogging.StrictLogging
import io.venuu.toolbox.time.Clock
import io.venuu.vuu.client.swing.gui.components.FilterBarPanel
import io.venuu.vuu.client.swing.gui.components.renderer.{SortedColumnRenderer, TreeGridCellRenderer}
import io.venuu.vuu.client.swing.messages._
import io.venuu.vuu.client.swing.model.{VSHackedTable, ViewPortedModel}
import io.venuu.vuu.client.swing.{ClientConstants, EventBus}
import io.venuu.vuu.net.{AggType, Aggregations, FilterSpec, SortDef, SortSpec}

import java.awt.event.{MouseAdapter, MouseEvent}
import java.awt.{Color, Dimension, Point}
import java.util.UUID
import javax.swing.event.{ChangeEvent, ChangeListener, ListSelectionEvent, ListSelectionListener}
import javax.swing.table.TableColumn
import javax.swing.{DefaultListSelectionModel, JComponent}
import scala.swing.BorderPanel.Position
import scala.swing._
import scala.swing.event.{MouseClicked, TableEvent}

class ComponentWithContext(val component: Component, val context: Object) extends Component{
  override lazy val peer: JComponent = component.peer
}

case class ColumnHeaderClicked(override val source: Table, column: Int, e: MouseEvent) extends TableEvent(source)

case class GridPanelViewPortContext(requestId: String, vpId: String, table: String, availableColumns: Array[String], columns: Array[String] = Array(),
                                    sortBy: SortSpec = SortSpec(List()), filter: String = "", groupBy: Array[String] = Array(),
                                    currentColumn: Option[TableColumn] = None,
                                    aggregations: Array[Aggregations] = Array())

class ViewServerGridPanel(requestId: String, tableName: String, availableColumns: Array[String], columns: Array[String], theModel: ViewPortedModel)(implicit val eventBus: EventBus[ClientMessage], timeProvider: Clock) extends BorderPanel with StrictLogging {

  //private var vpId: String = ""

  @volatile var context = GridPanelViewPortContext(requestId, "", tableName, availableColumns)

  eventBus.register( {
      //case ru: ClientServerRowUpdate if ru.vpId == vpId => handleRowUpdate(ru)
      case msg: ClientCreateViewPortSuccess =>
        if(msg.requestId == requestId) context = context.copy(vpId = msg.vpId, columns = msg.columns, sortBy = msg.sortBy, filter = msg.filter, groupBy = msg.groupBy)
      case msg: ClientChangeViewPortSuccess =>
        if(msg.requestId == requestId) context = context.copy(columns = msg.columns, sortBy = msg.sortBy, filter = msg.filterSpec.filter, groupBy = msg.groupBy)
        toggleRenderer()
      case _ =>
  })

  //final val FETCH_COUNT = 100

  final val componentId: String = UUID.randomUUID().toString

  def getTable(): Table = {

    new VSHackedTable {
      model = theModel//new ViewPortedModel(vpId, columns)
    }
  }

  this.background = Color.YELLOW
  this.preferredSize = new Dimension(400, 500)

  val popUp = new components.PopupMenu{
    val editViewPort = new MenuItem(Action("Edit"){
      val modal = new VSChangeVpPanel(context)
      modal.open()
    })

    val disableViewPort = new MenuItem(Action("Disable ViewPort"){
        eventBus.publish(ClientDisableViewPort(RequestId.oneNew(), context.vpId))
    })

    val enableViewPort = new MenuItem(Action("Enable ViewPort"){
      eventBus.publish(ClientEnableViewPort(RequestId.oneNew(), context.vpId))
    })

    contents += editViewPort
    contents += disableViewPort
    contents += enableViewPort
  }

  val popUpGroupBy = new components.PopupMenu{

    val addToGroupByMenu: Menu = new Menu("Add to GroupBy") {
      val addNoAgg = new MenuItem(Action("No Aggregate") {
        context.currentColumn match {
          case Some(column) =>
            val name = column.getIdentifier.asInstanceOf[String]
            context = context.copy(groupBy = context.groupBy ++ Array(name))
            onChangeViewPort(context.filter, None)
          case None => println("bad")
        }
      })
      val addWithSum = new MenuItem(Action("Sum Aggregate") {
        context.currentColumn match {
          case Some(column) =>
            val name = column.getIdentifier.asInstanceOf[String]
            context = context.copy(groupBy = context.groupBy ++ Array(name), aggregations = context.aggregations ++ Array(Aggregations(name, AggType.Sum)))
            onChangeViewPort(context.filter, None)
          case None => println("bad")
        }
      })

      val addWithCount = new MenuItem(Action("Count Aggregate") {
        context.currentColumn match {
          case Some(column) =>
            val name = column.getIdentifier.asInstanceOf[String]
            context = context.copy(groupBy = context.groupBy ++ Array(name), aggregations = context.aggregations ++ Array(Aggregations(name, AggType.Count)))
            onChangeViewPort(context.filter, None)
          case None => println("bad")
        }

      })


      contents += addNoAgg
      contents += addWithCount
      contents += addWithSum
    }

    val addToAggregates: Menu = new Menu("Add to Aggregates") {
      val addWithSum = new MenuItem(Action("Sum") {
        context.currentColumn match {
          case Some(column) =>
            val name = column.getIdentifier.asInstanceOf[String]
            context = context.copy(aggregations = context.aggregations ++ Array(Aggregations(name, AggType.Sum)))
            onChangeViewPort(context.filter, None)
          case None =>
            println("bad")
        }
      })

      val addWithCount = new MenuItem(Action("Count") {
        context.currentColumn match {
          case Some(column) =>
            val name = column.getIdentifier.asInstanceOf[String]
            context = context.copy(aggregations = context.aggregations ++ Array(Aggregations(name, AggType.Count)))
            onChangeViewPort(context.filter, None)
          case None =>
            println("bad")
        }

      })


      contents += addWithSum
      contents += addWithCount
    }

      val removeFromGroupBy = new MenuItem(Action("Remove From GroupBy") {
        println("was here")
      })

    val enableViewPort = new MenuItem(Action("Enable ViewPort"){
      eventBus.publish(ClientEnableViewPort(RequestId.oneNew(), context.vpId))
    })

    contents += addToGroupByMenu
    contents += addToAggregates
    contents += removeFromGroupBy
    contents += enableViewPort
  }

  val table = getTable()

  val header = table.peer.getTableHeader

  table.peer.getTableHeader.addMouseListener(new MouseAdapter() {
    override def mouseClicked(e: MouseEvent) {
      publish(ColumnHeaderClicked(table, header.columnAtPoint(e.getPoint()), e) )
    }
  })

  table.peer.getTableHeader.setDefaultRenderer(new SortedColumnRenderer(theModel))

  listenTo(table.mouse.clicks)
  listenTo(table)
  listenTo(table.selection)

  table.peer.getSelectionModel.addListSelectionListener(new ListSelectionListener {
    override def valueChanged(e: ListSelectionEvent): Unit = {
      val selected = e.getSource.asInstanceOf[DefaultListSelectionModel].getSelectedIndices.toArray
      // eventBus.publish(ClientUpdateVPRange(RequestId.oneNew(), context.vpId, 0, 100))
      eventBus.publish(ClientSetSelection(RequestId.oneNew(), context.vpId, selected))
      logger.info("Setting Selected" + selected.mkString(",") + " e(first:" + e.getFirstIndex + ",last:" + e.getLastIndex + ",adjusting:" + e.getValueIsAdjusting + ")" + e.getSource)
    }
  })

  reactions += {

    case x: MouseClicked =>
      showGridMenuPopup(x)

    case x: ColumnHeaderClicked =>
      //if left click, then sort the column
      if(x.e.getButton == 1) {
        sortOnMenuClick(x)
      }
      //else this was a right click (or some ungoldy button 3 or 4
      //so show the popup
      else{
        showGroupByPopup(x)
      }
  }

  def toggleRenderer(): Unit = {
    if(context.groupBy.length > 0)
      this.table.peer.setDefaultRenderer(classOf[Object], new TreeGridCellRenderer())
    else
      table.peer.getTableHeader.setDefaultRenderer(new SortedColumnRenderer(theModel))
  }

  def showGridMenuPopup(x: MouseClicked) = {
    if(x.peer.getButton > 1) popUp.show(new ComponentWithContext(table, null), x.point.x,x.point.y)
  }

  def showGroupByPopup(x: ColumnHeaderClicked) = {
    val column = table.peer.columnAtPoint(x.e.getPoint)
    val name = table.peer.getColumnName(column)
    val columnObj = table.peer.getColumn(name)
    this.context = context.copy(currentColumn = Some(columnObj))
    popUpGroupBy.show(table, x.e.getX,x.e.getY)
  }

  def sortOnMenuClick(x: ColumnHeaderClicked) = {

    val name = theModel.getColumnName(x.column)

    val sortDef = theModel.hasSort(x.column) match {
      case Some(sort) => if(sort.sortType == 'A') sort.copy(sortType = 'D') else sort.copy(sortType = 'A')
      case None => SortDef(name, 'A')

    }

    val sortsAsMap = if(x.e.isShiftDown){
      theModel.getSortsMap().++(Map(name -> sortDef))
    }else{
      Map(name -> sortDef)
    }

    val asList = sortsAsMap.values.toList

    onChangeViewPort("", Some(asList))
  }

  val pane = new ScrollPane(table)

  val viewPort = pane.peer.getViewport

  @volatile var lastLast = -1
  @volatile var lastFirst = -1

  viewPort.addChangeListener(new ChangeListener {

    override def stateChanged(e: ChangeEvent): Unit = {

      val rectangle = viewPort.getViewRect

      val firstRow = table.peer.rowAtPoint(new Point(0, rectangle.y))

      val last = if( table.peer.rowAtPoint(new Point(0, rectangle.y + rectangle.height)) > firstRow ) table.peer.rowAtPoint(new Point(0, rectangle.y + rectangle.height)) else theModel.getRowCount

      logger.debug(s"state changed: view rect = $rectangle, firstrow = $firstRow, lastrow = $last")

      if(firstRow == lastFirst && lastLast == last){
      }
      else{
        if(context.vpId != ""){
          logger.info(s"[VP] Range Req ${firstRow}->${last + ClientConstants.OVERLAP}")
          if(firstRow == -1 || last == -1){
            eventBus.publish(ClientUpdateVPRange(RequestId.oneNew(), context.vpId, 0, 100))
          }else{
            eventBus.publish(ClientUpdateVPRange(RequestId.oneNew(), context.vpId, firstRow, last + ClientConstants.OVERLAP))
          }
        }

      }

      lastFirst = firstRow
      lastLast = last
    }
  })

  val filter = new FilterBarPanel(onChangeViewPort(_, None))

  def onChangeViewPort(filterText: String, sort: Option[List[SortDef]]): Unit = {

    val filterSpec = if(filter.getFilterText != "") FilterSpec(filter.getFilterText)
                     else null

    val sortSpec = sort match {
      case Some(fields) => SortSpec(fields)
      case None => SortSpec(List())
    }

    val reqId = RequestId.oneNew()

    SwingThread.swing(() => {
      toggleRenderer()
    })

    eventBus.publish(ClientChangeViewPortRequest(reqId, context.vpId, context.columns, filterSpec = filterSpec, sortBy = sortSpec, groupBy = context.groupBy, aggregations = context.aggregations))
  }

  layout(filter) = Position.North
  layout(pane) = Position.Center

}
