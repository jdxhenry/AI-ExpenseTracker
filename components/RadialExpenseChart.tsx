
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

    // Use a fixed internal coordinate system for D3 calculations
    // The SVG viewBox will handle the actual scaling to the container
    const width = 400;
    const height = 400;
    
    if (data.length === 0) {
      // Empty state visualization
      const g = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);
      g.append('circle').attr('r', 100).attr('fill', '#f3f4f6');
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .style('fill', '#9ca3af')
        .text('No activity yet');
      return;
    }

    // Increased radius slightly to utilize more of the available viewbox area
    const radius = Math.min(width, height) / 2.05; 
    const innerRadius = radius * 0.58; // Slightly larger center for readability on mobile

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<CategoryData>()
      .value(d => d.amount)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<CategoryData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .padAngle(0.02); // Slightly wider padding for a cleaner "iOS" look

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Colored Segments with subtle shadow
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .style('filter', 'drop-shadow(0px 3px 6px rgba(0,0,0,0.1))');

    // Labels: Only show percentage if the segment is large enough to prevent clutter
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .style('font-size', '13px')
      .style('font-weight', '800')
      .style('text-shadow', '0px 1px 3px rgba(0,0,0,0.5)')
      .style('pointer-events', 'none')
      .text(d => d.data.percentage > 8 ? `${Math.round(d.data.percentage)}%` : '');

    // Middle Circle: Clean white center
    g.append('circle')
      .attr('r', innerRadius - 2)
      .attr('fill', 'white')
      .style('filter', 'drop-shadow(0px 4px 15px rgba(0,0,0,0.06))');

    // Central Summary Text
    const central = g.append('g').attr('text-anchor', 'middle');
    
    central.append('text')
      .attr('dy', '-0.6em')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', '#8E8E93') // iOS Secondary Label Color
      .text('Total Spent');
    
    central.append('text')
      .attr('dy', '0.7em')
      .style('font-size', '28px')
      .style('font-weight', '900')
      .style('fill', '#1C1C1E') // iOS Primary Label Color
      .style('letter-spacing', '-0.5px')
      .text(`${currencySymbol}${Math.round(totalSpent).toLocaleString()}`);

    central.append('text')
      .attr('dy', '3.2em')
      .style('font-size', '12px')
      .style('font-weight', '700')
      .style('fill', '#007AFF') // iOS Blue
      .text(`${data.length} categories active`);

  }, [data, totalSpent, currencySymbol]);

  return (
    <div className="flex justify-center items-center w-full aspect-square max-w-[400px] mx-auto overflow-hidden p-2 sm:p-4">
      <svg 
        ref={svgRef} 
        viewBox="0 0 400 400"
        className="w-full h-full"
        aria-label="Radial budget breakdown chart"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
};

export default RadialExpenseChart;
