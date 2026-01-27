
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CategoryData } from '../types.ts';

interface Props {
  data: CategoryData[];
  totalSpent: number;
  currencySymbol: string;
}

const RadialExpenseChart: React.FC<Props> = ({ data, totalSpent, currencySymbol }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (data.length === 0) {
      // Empty state visualization
      const width = 400;
      const height = 400;
      const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);
      g.append('circle').attr('r', 100).attr('fill', '#f3f4f6');
      g.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em').style('font-size', '14px').style('fill', '#9ca3af').text('No Data');
      return;
    }

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2.2;
    const innerRadius = radius * 0.55;

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<CategoryData>()
      .value(d => d.amount)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<CategoryData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .padAngle(0.015);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Colored Segments
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .style('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.05))');

    // Percentages inside the segments (only if large enough)
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '12px')
      .style('font-weight', '700')
      .text(d => d.data.percentage > 7 ? `${Math.round(d.data.percentage)}%` : '');

    // Middle Circle: White center with shadow
    g.append('circle')
      .attr('r', innerRadius)
      .attr('fill', 'white')
      .style('filter', 'drop-shadow(0px 4px 12px rgba(0,0,0,0.08))');

    // Central Text
    const central = g.append('g').attr('text-anchor', 'middle');
    
    central.append('text')
      .attr('dy', '-0.5em')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', '#8E8E93')
      .text('Total Spent');
    
    central.append('text')
      .attr('dy', '0.8em')
      .style('font-size', '24px')
      .style('font-weight', '800')
      .style('fill', '#1C1C1E')
      .text(`${currencySymbol}${Math.round(totalSpent).toLocaleString()}`);

    central.append('text')
      .attr('dy', '3em')
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('fill', '#3b82f6')
      .text(`${data.length} Categories`);

  }, [data, totalSpent, currencySymbol]);

  return (
    <div className="flex justify-center items-center w-full overflow-hidden p-6">
      <svg 
        ref={svgRef} 
        width="400" 
        height="400" 
        viewBox="0 0 400 400"
        className="max-w-full h-auto"
      />
    </div>
  );
};

export default RadialExpenseChart;